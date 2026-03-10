import { useState, useRef, useCallback, useEffect } from "react";
import { Heart, MessageCircle, Share2, Play, Pause, UserPlus, UserCheck, Bookmark, Repeat2, BadgeCheck, MoreHorizontal } from "lucide-react";
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

const VideoCard = ({ video, isLiked: initialLiked = false }: VideoCardProps) => {
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

  // Check bookmark + repost status
  useEffect(() => {
    const fetchStatus = async () => {
      const { count } = await supabase.from("bookmarks").select("*", { count: "exact", head: true }).eq("video_id", video.id);
      setSavesCount(count || 0);
      if (!user) return;
      const { data: bm } = await supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("video_id", video.id).maybeSingle();
      setSaved(!!bm);
      const { data: rp } = await supabase.from("reposts").select("id").eq("user_id", user.id).eq("video_id", video.id).maybeSingle();
      setReposted(!!rp);
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
      // Double-tap: like (or redirect guest to auth)
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
      // User cancelled native share — don't count
      if (err?.name === "AbortError") return;
      // Fallback: try clipboard
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
      // Decrement manually - no RPC exists
    } else {
      await supabase.from("reposts").insert({ user_id: user.id, video_id: video.id });
      // Create notification if not own video
      if (video.user_id && video.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: video.user_id,
          from_user_id: user.id,
          type: "repost",
          video_id: video.id,
          message: `${displayName} reposted your highlight`,
        });
      }
      toast.success(language === "he" ? "שותף מחדש!" : "Reposted!");
    }
  };

  return (
    <div className="relative h-full w-full" onClick={isVideo ? handleTap : undefined}>
      {/* Media */}
      <div className="absolute inset-0">
        {video.media_type === "gallery" && video.gallery_urls && video.gallery_urls.length > 0 ? (
          <GalleryCarousel urls={video.gallery_urls} alt={video.caption || "Gallery"} />
        ) : video.media_type === "image" ? (
          <>
            <img src={video.video_url} className="h-full w-full object-cover" alt={video.caption || "Highlight"} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/30" />
          </>
        ) : (
          <>
            <video ref={videoRef} src={video.video_url} className="h-full w-full object-cover" loop playsInline autoPlay muted={globalMuted} poster={video.thumbnail_url || undefined} preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/30" />
          </>
        )}
      </div>

      {/* More button (top-right, not for own videos) */}
      {user && video.user_id && user.id !== video.user_id && (
        <button
          onClick={(e) => { e.stopPropagation(); setActionSheetOpen(true); }}
          className="absolute top-14 end-3 z-20 rounded-full bg-background/40 p-2 backdrop-blur-sm"
        >
          <MoreHorizontal className="h-5 w-5 text-foreground" />
        </button>
      )}

      {/* Play/Pause flash */}
      <AnimatePresence>
        {isVideo && showPlayIcon && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="rounded-full bg-background/40 p-4 backdrop-blur-sm">
              {playing ? <Pause className="h-10 w-10 text-primary-foreground" fill="currentColor" /> : <Play className="h-10 w-10 text-primary-foreground" fill="currentColor" />}
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

      {/* Left side actions */}
      <div className="absolute start-3 bottom-20 flex flex-col items-center gap-4 z-10" onClick={(e) => e.stopPropagation()}>
        {video.user_id && (
          <button onClick={() => navigate(`/player/${video.user_id}`)} className="relative mb-1">
            <div className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-primary/50 ring-offset-1 ring-offset-background">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-fire flex items-center justify-center">
                  <span className="font-display text-sm text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            {user && video.user_id && user.id !== video.user_id && !isFollowing && (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full gradient-fire flex items-center justify-center border-2 border-background">
                <span className="text-[10px] text-primary-foreground font-bold">+</span>
              </div>
            )}
          </button>
        )}

        <BasketballLikeButton liked={liked} count={likes} onLike={handleLike} />

        <button onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-0.5">
          <MessageCircle className="h-7 w-7 text-foreground drop-shadow-md" fill="none" />
          <span className="text-[11px] font-semibold text-foreground drop-shadow-md">{formatNumber(video.comments_count)}</span>
        </button>

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
          className="flex flex-col items-center gap-0.5"
        >
          <Bookmark className={`h-7 w-7 drop-shadow-md ${saved ? "text-primary fill-primary" : "text-foreground"}`} />
          <span className="text-[11px] font-semibold text-foreground drop-shadow-md">{formatNumber(savesCount)}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
          <Share2 className="h-7 w-7 text-foreground drop-shadow-md" />
          {sharesCount > 0 && (
            <span className="text-[11px] font-semibold text-foreground drop-shadow-md">{formatNumber(sharesCount)}</span>
          )}
        </button>

        <button onClick={handleRepost} className="flex flex-col items-center gap-0.5">
          <Repeat2 className={`h-7 w-7 drop-shadow-md ${reposted ? "text-primary" : "text-foreground"}`} />
          {repostsCount > 0 && (
            <span className="text-[11px] font-semibold text-foreground drop-shadow-md">{formatNumber(repostsCount)}</span>
          )}
        </button>

        {isVideo && <SoundWheel videoRef={videoRef} />}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-20 start-14 end-4 p-4 safe-bottom">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block rounded-md bg-destructive px-2 py-0.5 font-semibold text-destructive-foreground text-sm cursor-pointer hover:opacity-90 transition-opacity"
                onClick={(e) => { e.stopPropagation(); if (video.user_id) navigate(`/player/${video.user_id}`); }}
              >
                {displayName}
              </span>
              {profile?.verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" fill="currentColor" />}
            </div>
            <p className="text-xs text-foreground/50 mt-0.5">{handle}</p>
            {profile?.position && (
              <p className="text-xs text-foreground/60">{profile.position}{profile.team ? ` · ${profile.team}` : ""}</p>
            )}
          </div>
          {user && video.user_id && user.id !== video.user_id && (
            <button onClick={(e) => { e.stopPropagation(); toggleFollow(); }} disabled={followLoading}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${isFollowing ? "bg-secondary/80 text-secondary-foreground" : "gradient-fire text-primary-foreground shadow-glow"}`}
            >
              {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
              {isFollowing ? t("video.followingBtn") : t("video.followBtn")}
            </button>
          )}
        </div>
        {video.caption && <p className="text-sm text-foreground/90 mb-2 line-clamp-2">{video.caption}</p>}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.tags.map((tag) => (
              <button key={tag} onClick={(e) => { e.stopPropagation(); navigate(`/tag/${tag}`); }} className="text-xs text-primary font-medium hover:underline">
                #{tag}
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-foreground/50">{formatNumber(video.views_count)} {t("feed.views")}</p>
      </div>

      {/* Video progress bar */}
      {isVideo && (
        <div className="absolute bottom-[76px] inset-x-0 h-[3px] bg-foreground/10 z-10">
          <div className="h-full bg-primary transition-[width] duration-200 ease-linear" style={{ width: `${progress}%` }} />
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
