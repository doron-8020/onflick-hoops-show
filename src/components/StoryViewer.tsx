import { useEffect, useState, useRef, useCallback } from "react";
import { Send, Heart, Eye, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { type StoryGroup } from "@/hooks/useStories";

const STORY_DURATION = 5000;

interface StoryViewerProps {
  group: StoryGroup;
  onClose: () => void;
}

const StoryViewer = ({ group, onClose }: StoryViewerProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const dragStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOwn = group.userId === user?.id;
  const currentStory = group.stories[currentIndex];
  const isVideo = currentStory?.media_type === "video";

  // --- Timer logic ---
  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
  }, []);

  const advanceNext = useCallback(() => {
    if (currentIndex < group.stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, group.stories.length, onClose]);

  const startTimer = useCallback((remaining?: number) => {
    clearTimers();
    if (isVideo) return;

    const dur = remaining ?? STORY_DURATION;
    startTimeRef.current = Date.now();
    elapsedRef.current = STORY_DURATION - dur;

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) + elapsedRef.current;
      setProgress(Math.min(elapsed / STORY_DURATION, 1));
      if (elapsed < STORY_DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = window.setTimeout(advanceNext, dur);
  }, [clearTimers, isVideo, advanceNext]);

  // Start timer on index change
  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    setPaused(false);
    setLiked(false);
    if (!isVideo) startTimer();
    return clearTimers;
  }, [currentIndex, isVideo, startTimer, clearTimers]);

  // Check like status
  useEffect(() => {
    if (!user || !currentStory) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("story_likes")
        .select("id")
        .eq("story_id", currentStory.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setLiked(!!data);
    })();
  }, [currentStory?.id, user]);

  // Fetch viewer count for own stories
  useEffect(() => {
    if (!isOwn || !currentStory) return;
    (async () => {
      const { count } = await (supabase as any)
        .from("story_views")
        .select("*", { count: "exact", head: true })
        .eq("story_id", currentStory.id);
      setViewerCount(count || 0);
    })();
  }, [currentStory?.id, isOwn]);

  // Mark as viewed
  useEffect(() => {
    if (!user || isOwn || !currentStory) return;
    (supabase as any)
      .from("story_views")
      .insert({ story_id: currentStory.id, viewer_id: user.id })
      .then(() => {});
  }, [currentStory?.id, user, isOwn]);

  const pauseTimer = () => {
    if (paused || isVideo) return;
    setPaused(true);
    clearTimers();
    elapsedRef.current += Date.now() - startTimeRef.current;
  };

  const resumeTimer = () => {
    if (!paused || isVideo) return;
    setPaused(false);
    const remaining = Math.max(STORY_DURATION - elapsedRef.current, 0);
    if (remaining > 0) startTimer(remaining);
    else advanceNext();
  };

  const prevStory = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  // --- Like ---
  const toggleLike = async () => {
    if (!user || !currentStory) return;
    if (liked) {
      await (supabase as any)
        .from("story_likes")
        .delete()
        .eq("story_id", currentStory.id)
        .eq("user_id", user.id);
      setLiked(false);
    } else {
      await (supabase as any)
        .from("story_likes")
        .insert({ story_id: currentStory.id, user_id: user.id });
      setLiked(true);
    }
  };

  // --- Reply ---
  const handleReply = async () => {
    if (!replyText.trim() || !user || sendingReply || isOwn) return;
    setSendingReply(true);
    pauseTimer();

    const otherUserId = group.userId;
    const [u1, u2] = user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

    const { data: existing } = await (supabase as any)
      .from("conversations")
      .select("id")
      .eq("user1_id", u1)
      .eq("user2_id", u2)
      .maybeSingle();

    let convId: string;
    if (existing) {
      convId = existing.id;
    } else {
      const { data: newConv, error } = await (supabase as any)
        .from("conversations")
        .insert({ user1_id: u1, user2_id: u2 })
        .select("id")
        .single();
      if (error || !newConv) {
        toast.error(language === "he" ? "שגיאה" : "Failed");
        setSendingReply(false);
        resumeTimer();
        return;
      }
      convId = newConv.id;
    }

    const content = `📸 ${language === "he" ? "הגיב/ה לסטורי" : "Replied to your story"}: "${replyText.trim()}"`;
    await (supabase as any)
      .from("direct_messages")
      .insert({ conversation_id: convId, sender_id: user.id, content });

    await (supabase as any)
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convId);

    toast.success(language === "he" ? "נשלח!" : "Sent!");
    setReplyText("");
    setSendingReply(false);
    resumeTimer();
  };

  // --- Fetch viewers list ---
  const fetchViewers = async () => {
    if (!currentStory) return;
    const { data: views } = await (supabase as any)
      .from("story_views")
      .select("viewer_id")
      .eq("story_id", currentStory.id);
    if (!views || views.length === 0) { setViewers([]); return; }
    const ids = views.map((v: any) => v.viewer_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", ids);
    setViewers(profiles || []);
  };

  // --- Swipe down to close ---
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const diff = e.changedTouches[0].clientY - dragStartY.current;
    if (diff > 100) onClose();
    dragStartY.current = null;
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="absolute top-[env(safe-area-inset-top,8px)] left-3 right-3 flex gap-1 z-20 pt-2">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
            {i < currentIndex ? (
              <motion.div className="h-full w-full bg-white rounded-full" />
            ) : i === currentIndex ? (
              <motion.div
                className="h-full bg-white rounded-full"
                style={{ width: isVideo ? undefined : `${progress * 100}%` }}
                {...(isVideo ? { animate: { width: "100%" }, transition: { duration: 15, ease: "linear" } } : {})}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-[calc(env(safe-area-inset-top,8px)+20px)] left-3 right-3 flex items-center gap-2.5 z-20">
        <Avatar className="h-9 w-9 ring-2 ring-white/30">
          <AvatarImage src={group.avatarUrl || undefined} />
          <AvatarFallback className="bg-white/20 text-white text-xs">
            {group.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <span className="text-white text-sm font-semibold">{group.displayName}</span>
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
            STORY
          </span>
        </div>
        {isOwn && (
          <button
            onClick={async () => {
              if (!currentStory) return;
              pauseTimer();
              const confirmed = window.confirm(language === "he" ? "למחוק את הסטורי?" : "Delete this story?");
              if (!confirmed) { resumeTimer(); return; }
              await (supabase as any).from("stories").delete().eq("id", currentStory.id);
              toast.success(language === "he" ? "הסטורי נמחק" : "Story deleted");
              if (group.stories.length <= 1) { onClose(); return; }
              const newStories = group.stories.filter((_, i) => i !== currentIndex);
              group.stories.splice(0, group.stories.length, ...newStories);
              setCurrentIndex(Math.min(currentIndex, newStories.length - 1));
            }}
            className="text-white/70 p-1 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
        <button onClick={onClose} className="text-white p-1">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        {isVideo ? (
          <video
            key={currentStory.id}
            src={currentStory.media_url}
            autoPlay
            playsInline
            className="max-h-full max-w-full object-contain"
            onEnded={advanceNext}
          />
        ) : (
          <img
            key={currentStory.id}
            src={currentStory.media_url}
            className="max-h-full max-w-full object-contain"
            alt=""
          />
        )}
      </div>

      {/* Caption */}
      {currentStory?.caption && (
        <div className="absolute bottom-28 left-0 right-0 px-4 z-20">
          <p className="text-white text-sm text-center bg-black/40 backdrop-blur-sm rounded-xl px-3 py-2">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* Nav tap zones */}
      <button
        onClick={prevStory}
        onMouseDown={pauseTimer}
        onMouseUp={resumeTimer}
        className="absolute left-0 top-20 bottom-24 w-1/3 z-10"
        aria-label="Previous"
      />
      <button
        onClick={advanceNext}
        onMouseDown={pauseTimer}
        onMouseUp={resumeTimer}
        className="absolute right-0 top-20 bottom-24 w-1/3 z-10"
        aria-label="Next"
      />
      {/* Center hold zone */}
      <div
        onMouseDown={pauseTimer}
        onMouseUp={resumeTimer}
        onTouchStart={pauseTimer}
        onTouchEnd={resumeTimer}
        className="absolute left-1/3 right-1/3 top-20 bottom-24 z-10"
      />

      {/* Bottom bar */}
      <div className="shrink-0 px-3 py-3 pb-[env(safe-area-inset-bottom,12px)] z-20 flex items-center gap-2">
        {isOwn ? (
          /* Owner view: viewer count */
          <button
            onClick={async () => {
              pauseTimer();
              await fetchViewers();
              setShowViewers(true);
            }}
            className="flex items-center gap-1.5 text-white/80 text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>{viewerCount}</span>
          </button>
        ) : (
          /* Other user: reply input */
          <>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={pauseTimer}
              onBlur={() => { if (!replyText.trim()) resumeTimer(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleReply(); } }}
              placeholder={language === "he" ? "שלח הודעה..." : "Send a message..."}
              className="flex-1 rounded-full px-4 py-2.5 text-sm bg-white/15 text-white placeholder:text-white/50 border border-white/20 outline-none focus:border-white/50 transition-colors"
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || sendingReply}
              className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              <Send className="h-4 w-4 text-primary-foreground" />
            </button>
          </>
        )}

        {/* Like button (always visible) */}
        <button onClick={toggleLike} className="ml-auto p-2">
          <Heart
            className={`h-6 w-6 transition-colors ${liked ? "text-red-500 fill-red-500" : "text-white"}`}
          />
        </button>
      </div>

      {/* Viewers sheet */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl rounded-t-2xl z-30 max-h-[60vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-semibold text-sm">
                {language === "he" ? "צפו בסטורי" : "Viewers"} ({viewers.length})
              </span>
              <button onClick={() => { setShowViewers(false); resumeTimer(); }} className="text-white/60">
                <X className="h-5 w-5" />
              </button>
            </div>
            {viewers.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-8">
                {language === "he" ? "אין צפיות עדיין" : "No viewers yet"}
              </p>
            ) : (
              <div className="divide-y divide-white/5">
                {viewers.map((v) => (
                  <div key={v.user_id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={v.avatar_url || undefined} />
                      <AvatarFallback className="bg-white/10 text-white text-xs">
                        {(v.display_name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white text-sm">{v.display_name || "User"}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StoryViewer;
