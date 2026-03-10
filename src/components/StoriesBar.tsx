import { useEffect, useState, useRef, useCallback } from "react";
import { Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface StoryGroup {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  stories: { id: string; media_url: string; media_type: string; created_at: string }[];
  hasUnviewed: boolean;
}

const STORY_DURATION = 5000; // 5 seconds per image story

const StoriesBar = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [viewingStory, setViewingStory] = useState<StoryGroup | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // --- Fetch stories ---
  const fetchStories = async () => {
    const { data: stories } = await (supabase as any)
      .from("stories")
      .select("*")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!stories || stories.length === 0) {
      setStoryGroups([]);
      return;
    }

    const userIds = [...new Set(stories.map((s: any) => s.user_id))] as string[];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    let viewedIds = new Set<string>();
    if (user) {
      const { data: views } = await (supabase as any)
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", user.id);
      viewedIds = new Set((views || []).map((v: any) => v.story_id));
    }

    const groupMap = new Map<string, StoryGroup>();
    for (const s of stories) {
      if (!groupMap.has(s.user_id)) {
        const profile = profileMap.get(s.user_id);
        groupMap.set(s.user_id, {
          userId: s.user_id,
          displayName: profile?.display_name || "User",
          avatarUrl: profile?.avatar_url || null,
          stories: [],
          hasUnviewed: false,
        });
      }
      const group = groupMap.get(s.user_id)!;
      group.stories.push(s);
      if (!viewedIds.has(s.id)) group.hasUnviewed = true;
    }

    const groups = Array.from(groupMap.values());
    if (user) {
      const myIdx = groups.findIndex((g) => g.userId === user.id);
      if (myIdx > 0) {
        const [mine] = groups.splice(myIdx, 1);
        groups.unshift(mine);
      }
    }
    setStoryGroups(groups);
  };

  useEffect(() => { fetchStories(); }, [user]);

  // --- Auto-advance timer ---
  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const animateProgress = useCallback((startAt: number, duration: number) => {
    const tick = () => {
      const now = Date.now();
      const elapsed = now - startAt;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startTimer = useCallback((remaining?: number) => {
    clearTimers();
    const currentStory = viewingStory?.stories[currentIndex];
    if (!currentStory || currentStory.media_type === "video") return;

    const dur = remaining ?? STORY_DURATION;
    startTimeRef.current = Date.now();
    elapsedRef.current = STORY_DURATION - dur;

    animateProgress(Date.now() - elapsedRef.current, STORY_DURATION);

    timerRef.current = window.setTimeout(() => {
      nextStoryRef.current();
    }, dur);
  }, [viewingStory, currentIndex, clearTimers, animateProgress]);

  const nextStoryRef = useRef(() => {});
  
  const nextStory = useCallback(() => {
    if (!viewingStory) return;
    if (currentIndex < viewingStory.stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      closeStoryRef.current();
    }
  }, [viewingStory, currentIndex]);

  const closeStoryRef = useRef(() => {});
  
  const closeStory = useCallback(() => {
    clearTimers();
    setViewingStory(null);
    setProgress(0);
    setReplyText("");
    setPaused(false);
    fetchStories();
  }, [clearTimers]);

  // Keep refs updated
  useEffect(() => { nextStoryRef.current = nextStory; }, [nextStory]);
  useEffect(() => { closeStoryRef.current = closeStory; }, [closeStory]);

  // Start timer when story or index changes
  useEffect(() => {
    if (!viewingStory) return;
    setProgress(0);
    elapsedRef.current = 0;
    if (!paused) startTimer();
    return clearTimers;
  }, [viewingStory, currentIndex]);

  const pauseTimer = () => {
    if (paused) return;
    setPaused(true);
    clearTimers();
    elapsedRef.current += Date.now() - startTimeRef.current;
  };

  const resumeTimer = () => {
    if (!paused) return;
    setPaused(false);
    const remaining = STORY_DURATION - elapsedRef.current;
    if (remaining > 0) startTimer(remaining);
  };

  // --- Actions ---
  const handleAddStory = async () => {
    if (!user) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `stories/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("videos").upload(path, file);
      if (uploadErr) {
        toast.error(language === "he" ? "שגיאה בהעלאה" : "Upload failed");
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);
      await (supabase as any).from("stories").insert({
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: file.type.startsWith("video") ? "video" : "image",
      });
      toast.success(language === "he" ? "הסטורי עלה!" : "Story posted!");
      setUploading(false);
      fetchStories();
    };
    input.click();
  };

  const openStory = async (group: StoryGroup) => {
    setViewingStory(group);
    setCurrentIndex(0);
    setPaused(false);
    if (user && group.userId !== user.id) {
      for (const s of group.stories) {
        await (supabase as any)
          .from("story_views")
          .insert({ story_id: s.id, viewer_id: user.id })
          .select()
          .maybeSingle();
      }
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  // --- Reply to story ---
  const handleReply = async () => {
    if (!replyText.trim() || !user || !viewingStory || sendingReply) return;
    if (viewingStory.userId === user.id) return;

    setSendingReply(true);
    pauseTimer();

    const otherUserId = viewingStory.userId;
    const [u1, u2] = user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

    // Find or create conversation
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
        toast.error(language === "he" ? "שגיאה בשליחה" : "Failed to send");
        setSendingReply(false);
        resumeTimer();
        return;
      }
      convId = newConv.id;
    }

    // Send reply as DM
    const content = `📸 ${language === "he" ? "הגיב/ה לסטורי שלך" : "Replied to your story"}: "${replyText.trim()}"`;
    await (supabase as any)
      .from("direct_messages")
      .insert({ conversation_id: convId, sender_id: user.id, content });

    await (supabase as any)
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convId);

    toast.success(language === "he" ? "התגובה נשלחה!" : "Reply sent!");
    setReplyText("");
    setSendingReply(false);
    resumeTimer();
  };

  const myGroup = storyGroups.find((g) => g.userId === user?.id);
  const hasMyStory = !!myGroup;
  const isOwnStory = viewingStory?.userId === user?.id;

  return (
    <>
      {/* Stories bar */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {user && (
          <button
            onClick={hasMyStory ? () => openStory(myGroup!) : handleAddStory}
            disabled={uploading}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="relative">
              <div className={`h-16 w-16 rounded-full border-2 ${hasMyStory ? "border-primary" : "border-muted"} flex items-center justify-center overflow-hidden`}>
                {myGroup?.avatarUrl ? (
                  <img src={myGroup.avatarUrl} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="h-full w-full bg-secondary flex items-center justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              {!hasMyStory && (
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Plus className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-16 text-center">
              {language === "he" ? "הסטורי שלי" : "Your story"}
            </span>
          </button>
        )}

        {storyGroups
          .filter((g) => g.userId !== user?.id)
          .map((group) => (
            <button
              key={group.userId}
              onClick={() => openStory(group)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div
                className={`h-16 w-16 rounded-full p-[2px] ${
                  group.hasUnviewed
                    ? "bg-gradient-to-tr from-primary to-orange-500"
                    : "bg-muted"
                }`}
              >
                <div className="h-full w-full rounded-full overflow-hidden bg-background p-[2px]">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={group.avatarUrl || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-xs">
                      {group.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-16 text-center">
                {group.displayName}
              </span>
            </button>
          ))}
      </div>

      {/* Story viewer overlay */}
      {viewingStory && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
            {viewingStory.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
                {i < currentIndex ? (
                  <div className="h-full w-full bg-white rounded-full" />
                ) : i === currentIndex ? (
                  <div
                    className="h-full bg-white rounded-full"
                    style={{
                      width: `${progress * 100}%`,
                      transition: "width 0.1s linear",
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 flex items-center gap-2 z-20">
            <Avatar className="h-8 w-8">
              <AvatarImage src={viewingStory.avatarUrl || undefined} />
              <AvatarFallback className="bg-white/20 text-white text-xs">
                {viewingStory.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-semibold">{viewingStory.displayName}</span>
            <button onClick={closeStory} className="ml-auto text-white text-xl font-bold px-2">✕</button>
          </div>

          {/* Content */}
          <div
            className="flex-1 flex items-center justify-center"
            onMouseDown={pauseTimer}
            onMouseUp={resumeTimer}
            onTouchStart={pauseTimer}
            onTouchEnd={resumeTimer}
          >
            {viewingStory.stories[currentIndex]?.media_type === "video" ? (
              <video
                key={viewingStory.stories[currentIndex].id}
                src={viewingStory.stories[currentIndex].media_url}
                autoPlay
                playsInline
                muted
                className="max-h-full max-w-full object-contain"
                onEnded={nextStory}
              />
            ) : (
              <img
                key={viewingStory.stories[currentIndex]?.id}
                src={viewingStory.stories[currentIndex]?.media_url}
                className="max-h-full max-w-full object-contain"
                alt=""
              />
            )}
          </div>

          {/* Touch areas for prev/next */}
          <button
            onClick={prevStory}
            className="absolute left-0 top-16 bottom-20 w-1/3 z-10"
            aria-label="Previous"
          />
          <button
            onClick={nextStory}
            className="absolute right-0 top-16 bottom-20 w-2/3 z-10"
            aria-label="Next"
          />

          {/* Reply input (only for other users' stories) */}
          {user && !isOwnStory && (
            <div className="shrink-0 px-4 py-3 pb-[env(safe-area-inset-bottom,12px)] z-20 flex items-center gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={pauseTimer}
                onBlur={() => { if (!replyText.trim()) resumeTimer(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleReply(); } }}
                placeholder={language === "he" ? "הגב לסטורי..." : "Reply to story..."}
                className="flex-1 rounded-full px-4 py-2.5 text-sm bg-white/15 text-white placeholder:text-white/50 border border-white/20 outline-none focus:border-white/50 transition-colors"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sendingReply}
                className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default StoriesBar;
