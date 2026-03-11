import { useState, useRef, useCallback, useEffect } from "react";
import { Heart, MessageCircle, Share2, Play, Pause, Bookmark, Repeat2, BadgeCheck, MoreHorizontal, Music2 } from "lucide-react";
import BasketballLikeButton from "./BasketballLikeButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMute } from "@/contexts/MuteContext";
import { useFollow } from "@/hooks/useFollow";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CommentsSheet from "./CommentsSheet";
import GalleryCarousel from "./GalleryCarousel";
import SoundWheel from "./SoundWheel";
import VideoActionSheet from "./VideoActionSheet";

interface VideoCardProps {
  video: {
    id: string;
    user_id?: string;
    video_url: string;
    thumbnail_url: string | null;
    caption: string | null;
    tags: string[] | null;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    views_count: number;
    media_type?: string;
    gallery_urls?: string[] | null;
    reposts_count?: number;
    profiles?: {
      display_name: string | null;
      avatar_url: string | null;
      position: string | null;
      team: string | null;
      verified?: boolean;
    } | null;
  };
  isLiked?: boolean;
  onDeleted?: (videoId: string) => void;
}

const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

const haptic = (ms = 30) => {
  try {
    if ("vibrate" in navigator) navigator.vibrate(ms);
  } catch {}
};

const VideoCard = ({ video, isLiked: initialLiked = false, onDeleted }: VideoCardProps) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(video.likes_count);
  const [saved, setSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostsCount, setRepostsCount] = useState(video.reposts_count || 0);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { globalMuted } = useMute();
  const navigate = useNavigate();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollow(video.user_id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<number>(0);
  const progressRAF = useRef<number>(0);

  const profile = video.profiles;
  const displayName = profile?.display_name || "Player";
  const handle = `@${(displayName).toLowerCase().replace(/\s+/g, "")}`;
  const isVideo = video.media_type !== "image" && video.media_type !== "gallery";

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = globalMuted;
  }, [globalMuted]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isVideo) return;
    const tick = () => {
      if (el.duration) setProgress((el.currentTime / el.duration) * 100);
      progressRAF.current = requestAnimationFrame(tick);
    };
    progressRAF.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progressRAF.current);
  }, [isVideo]);

  // Check bookmark + repost status — all in parallel
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) {
        const { count } = await supabase.from("bookmarks").select("*", { count: "exact", head: true }).eq("video_id", video.id);
        setSavesCount(count || 0);
        return;
      }
      const [countRes, bmRes, rpRes] = await Promise.all([
        supabase.from("bookmarks").select("*", { count: "exact", head: true }).eq("video_id", video.id).then(r => r),
        supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("video_id", video.id).maybeSingle().then(r => r),
        supabase.from("reposts").select("id").eq("user_id", user.id).eq("video_id", video.id).maybeSingle().then(r => r),
      ]);
      setSavesCount(countRes.count || 0);
      setSaved(!!bmRes.data);
      setReposted(!!rpRes.data);
    };
    fetchStatus();
  }, [user, video.id]);

  const handleLike = useCallback(async () => {
    if (!user) { navigate("/auth"); return; }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((prev) => (newLiked ? prev + 1 : prev - 1));
    haptic(newLiked ? 40 : 20);
    const { error } = await supabase.rpc("toggle_video_like", { p_video_id: video.id });
    if (error) { setLiked(!newLiked); setLikes((prev) => (newLiked ? prev - 1 : prev + 1)); toast.error(t("video.likeError")); }
  }, [liked, user, video.id, t, navigate]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (!user) { navigate("/auth"); lastTapRef.current = 0; return; }
      if (!liked) handleLike(); else haptic(40);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        if (videoEl.paused) { videoEl.play().catch(() => {}); setPlaying(true); }
        else { videoEl.pause(); setPlaying(false); }
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 600);
      }, 300);
    }
  }, [liked, handleLike, user, navigate]);

  const [sharesCount, setSharesCount] = useState(video.shares_count);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic(15);
    const shareUrl = `${window.location.origin}/?v=${video.id}`;
    const shareData = { title: video.caption || "Check this highlight!", url: shareUrl };
    let shared = false;
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        shared = true;
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t("video.linkCopied"));
        shared = true;
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t("video.linkCopied"));
        shared = true;
      } catch { toast.error("Could not share"); }
    }
    if (shared) {
      setSharesCount((c) => c + 1);
      await supabase.rpc("increment_shares", { p_video_id: video.id });
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    haptic(20);
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setRepostsCount((c) => wasReposted ? c - 1 : c + 1);

    if (wasReposted) {
      await supabase.from("reposts").delete().eq("user_id", user.id).eq("video_id", video.id);
    } else {
      await supabase.from("reposts").insert({ user_id: user.id, video_id: video.id });
      if (video.user_id && video.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: video.user_id,
          from_user_id: user.id,
          type: "repost",
          video_id: video.id,
          message: `${displayName} reposted your highlight`,
        });
      }
      toast.success(t("video.reposted"));
    }
  };

  const musicText = `${displayName} · Original Sound`;

  return (
    <div className="relative h-full w-full" onClick={isVideo ? handleTap : undefined}>
      {/* Media */}
      <div className="absolute inset-0">
        {video.media_type === "gallery" && video.gallery_urls && video.gallery_urls.length > 0 ? (
          <GalleryCarousel urls={video.gallery_urls} alt={video.caption || "Gallery"} />
        ) : video.media_type === "image" ? (
          <>
            <img src={video.video_url} className="h-full w-full object-cover" alt={video.caption || "Highlight"} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </>
        ) : (
          <>
            <video ref={videoRef} src={video.video_url} className="h-full w-full object-cover" loop playsInline autoPlay muted={globalMuted} poster={video.thumbnail_url || undefined} preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </>
        )}
      </div>

      {/* More button (top-right) */}
      {user && video.user_id && (
        <button
          onClick={(e) => { e.stopPropagation(); haptic(10); setActionSheetOpen(true); }}
          className="absolute top-[56px] end-[14px] z-20 rounded-full bg-black/30 h-8 w-8 flex items-center justify-center backdrop-blur-sm"
        >
          <MoreHorizontal className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Play/Pause flash */}
      <AnimatePresence>
        {isVideo && showPlayIcon && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="rounded-full bg-black/40 p-4 backdrop-blur-sm">
              {playing ? <Pause className="h-10 w-10 text-white" fill="currentColor" /> : <Play className="h-10 w-10 text-white" fill="currentColor" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5, y: -60 }} transition={{ duration: 0.4, ease: "easeOut" }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="h-28 w-28 text-primary drop-shadow-lg" fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side action column — end side (right in LTR, left in RTL) */}
      <div className="absolute end-3 flex flex-col items-center gap-4 z-10" style={{ bottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }} onClick={(e) => e.stopPropagation()}>
        {/* Avatar */}
        {video.user_id && (
          <button onClick={() => { haptic(10); navigate(`/player/${video.user_id}`); }} className="relative mb-1">
            <div className="h-[44px] w-[44px] rounded-full overflow-hidden ring-2 ring-white ring-offset-1 ring-offset-black/30">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-fire flex items-center justify-center">
                  <span className="font-display text-sm text-white">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            {/* Follow + button — only when not following */}
            {user && video.user_id && user.id !== video.user_id && !isFollowing && (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-[#FE2C55] flex items-center justify-center border-2 border-black/60">
                <span className="text-[10px] text-white font-bold">+</span>
              </div>
            )}
          </button>
        )}

        {/* Like */}
        <BasketballLikeButton liked={liked} count={likes} onLike={handleLike} />

        {/* Comments */}
        <button onClick={() => { haptic(10); setCommentsOpen(true); }} className="flex flex-col items-center gap-1">
          <MessageCircle className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />
          <span className="text-[12px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{formatNumber(video.comments_count)}</span>
        </button>

        {/* Bookmark — white outline/fill only */}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (!user) { navigate("/auth"); return; }
            haptic(20);
            if (saved) {
              setSaved(false); setSavesCount((c) => c - 1);
              const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("video_id", video.id);
              if (error) { setSaved(true); setSavesCount((c) => c + 1); } else toast.success(t("video.unsaved"));
            } else {
              setSaved(true); setSavesCount((c) => c + 1);
              const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, video_id: video.id });
              if (error) { setSaved(false); setSavesCount((c) => c - 1); } else toast.success(t("video.saved"));
            }
          }}
          className="flex flex-col items-center gap-1"
        >
          <Bookmark className={`h-7 w-7 drop-shadow-md ${saved ? "text-white fill-white" : "text-white"}`} strokeWidth={1.5} />
          <span className="text-[12px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{formatNumber(savesCount)}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <Share2 className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />
          <span className="text-[12px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{formatNumber(sharesCount)}</span>
        </button>

        {/* Repost */}
        <button onClick={handleRepost} className="flex flex-col items-center gap-1">
          <Repeat2 className={`h-7 w-7 drop-shadow-md ${reposted ? "text-primary" : "text-white"}`} strokeWidth={1.5} />
          {repostsCount > 0 && (
            <span className="text-[12px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{formatNumber(repostsCount)}</span>
          )}
        </button>

        {/* Sound Wheel */}
        {isVideo ? (
          <SoundWheel videoRef={videoRef} isPlaying={playing} thumbnailUrl={profile?.avatar_url || video.thumbnail_url} />
        ) : (
          <div className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center opacity-40">
            <Music2 className="h-5 w-5 text-white/50" />
          </div>
        )}
      </div>

      {/* Bottom info area — start side (left in LTR, right in RTL) */}
      <div className="absolute start-3 end-[72px] z-10" style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
        {/* Gradient readability overlay */}
        <div className="absolute inset-0 -start-3 -bottom-[72px] -end-[72px] pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)" }} />

        <div className="relative">
          {/* Username + Follow */}
          <div className="flex items-center gap-2 mb-1">
            <button
              className="flex items-center gap-1"
              onClick={(e) => { e.stopPropagation(); haptic(10); if (video.user_id) navigate(`/player/${video.user_id}`); }}
            >
              <span className="text-[16px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">{handle}</span>
              {profile?.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#20D5EC] shrink-0" fill="currentColor" />}
            </button>
            {user && video.user_id && user.id !== video.user_id && (
              <button onClick={(e) => { e.stopPropagation(); haptic(15); toggleFollow(); }} disabled={followLoading}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all border ${isFollowing ? "border-white/30 text-white/80" : "border-primary bg-primary/90 text-white"}`}
              >
                {isFollowing ? t("video.followingBtn") : t("video.followBtn")}
              </button>
            )}
          </div>

          {/* Caption */}
          {video.caption && (
            <p className="text-[14px] leading-[1.4] text-white/90 mb-1.5 line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{video.caption}</p>
          )}

          {/* Tags — white color */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {video.tags.map((tag) => (
                <button key={tag} onClick={(e) => { e.stopPropagation(); navigate(`/tag/${tag}`); }} className="text-[13px] text-white font-medium hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Music marquee */}
          <div className="flex items-center gap-1.5 overflow-hidden max-w-[220px]">
            <Music2 className="h-3.5 w-3.5 text-white shrink-0" />
            <div className="overflow-hidden whitespace-nowrap">
              <span className="inline-block text-[13px] text-white/80 animate-marquee">{musicText}</span>
            </div>
          </div>

          {/* View count */}
          <p className="mt-1.5 text-[12px] text-white/60">{formatNumber(video.views_count)} {t("feed.views")}</p>
        </div>
      </div>

      {/* Video progress bar — thin white line, above home indicator */}
      {isVideo && (
        <div className="absolute inset-x-0 h-[2px] bg-white/10 z-10" style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
          <div className="h-full bg-white/80 transition-[width] duration-200 ease-linear" style={{ width: `${progress}%` }} />
        </div>
      )}

      <CommentsSheet videoId={video.id} open={commentsOpen} onOpenChange={setCommentsOpen} />
      {video.user_id && (
        <VideoActionSheet videoId={video.id} videoUserId={video.user_id} open={actionSheetOpen} onOpenChange={setActionSheetOpen} />
      )}
    </div>
  );
};

export default VideoCard;
