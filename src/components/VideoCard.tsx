import { useState, useRef, useCallback, useEffect } from "react";
import { Heart, MessageCircle, Share2, Play, Pause, UserPlus, UserCheck, Bookmark, Repeat2 } from "lucide-react";
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
import SpinningSoundIcon from "./SpinningSoundIcon";

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
    profiles?: {
      display_name: string | null;
      avatar_url: string | null;
      position: string | null;
      team: string | null;
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
  const [showHeart, setShowHeart] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { globalMuted } = useMute();
  const navigate = useNavigate();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollow(video.user_id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = globalMuted;
  }, [globalMuted]);

  const handleLike = useCallback(async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((prev) => (newLiked ? prev + 1 : prev - 1));
    haptic(newLiked ? 40 : 20);
    const { error } = await supabase.rpc("toggle_video_like", { p_video_id: video.id });
    if (error) {
      setLiked(!newLiked);
      setLikes((prev) => (newLiked ? prev - 1 : prev + 1));
      toast.error(t("video.likeError"));
    }
  }, [liked, user, video.id, t, navigate]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (!liked) handleLike();
      else haptic(40);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        if (videoEl.paused) {
          videoEl.play().catch(() => {});
          setPlaying(true);
        } else {
          videoEl.pause();
          setPlaying(false);
        }
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 600);
      }, 300);
    }
  }, [liked, handleLike]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: video.caption || "Check this highlight!",
      url: `${window.location.origin}/?v=${video.id}`,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success(t("video.linkCopied"));
      }
    } catch {}
  };

  const profile = video.profiles;
  const displayName = profile?.display_name || "Player";
  const isVideo = video.media_type !== "image" && video.media_type !== "gallery";

  return (
    <div className="relative h-full w-full" onClick={isVideo ? handleTap : undefined}>
      {/* Media */}
      <div className="absolute inset-0">
        {video.media_type === "gallery" && video.gallery_urls && video.gallery_urls.length > 0 ? (
          <GalleryCarousel urls={video.gallery_urls} alt={video.caption || "Gallery"} />
        ) : video.media_type === "image" ? (
          <>
            <img
              src={video.video_url}
              className="h-full w-full object-cover"
              alt={video.caption || "Highlight"}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/30" />
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              src={video.video_url}
              className="h-full w-full object-cover"
              loop
              playsInline
              muted={globalMuted}
              poster={video.thumbnail_url || undefined}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/30" />
          </>
        )}
      </div>

      {/* Play/Pause flash */}
      <AnimatePresence>
        {isVideo && showPlayIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="rounded-full bg-background/40 p-4 backdrop-blur-sm">
              {playing ? (
                <Play className="h-10 w-10 text-primary-foreground" fill="currentColor" />
              ) : (
                <Pause className="h-10 w-10 text-primary-foreground" fill="currentColor" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5, y: -60 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <Heart className="h-28 w-28 text-primary drop-shadow-lg" fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound wheel removed */}

      {/* Left side actions (RTL) */}
      <div
        className="absolute start-3 bottom-32 flex flex-col items-center gap-4 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <BasketballLikeButton liked={liked} count={likes} onLike={handleLike} />

        <button onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-0.5">
          <MessageCircle className="h-7 w-7 text-foreground drop-shadow-md" fill="none" />
          <span className="text-[11px] font-semibold text-foreground drop-shadow-md">
            {formatNumber(video.comments_count)}
          </span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setSaved(!saved);
            haptic(20);
            toast.success(saved ? t("video.unsaved") : t("video.saved"));
          }}
          className="flex flex-col items-center gap-0.5"
        >
          <Bookmark className={`h-7 w-7 drop-shadow-md ${saved ? "text-primary fill-primary" : "text-foreground"}`} />
          <span className="text-[11px] font-semibold text-foreground drop-shadow-md">0</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
          <Share2 className="h-7 w-7 text-foreground drop-shadow-md" />
          <span className="text-[11px] font-semibold text-foreground drop-shadow-md">
            {t("video.share")}
          </span>
        </button>
      </div>

      {/* Avatar - right side */}
      <div className="absolute end-3 bottom-44 z-10" onClick={(e) => e.stopPropagation()}>
        {video.user_id && (
          <button onClick={() => navigate(`/player/${video.user_id}`)} className="relative">
            <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary/50 ring-offset-1 ring-offset-background">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-fire flex items-center justify-center">
                  <span className="font-display text-sm text-primary-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
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
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-20 start-0 end-16 p-4 safe-bottom">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <span
              className="inline-block rounded-md bg-red-600 px-2 py-0.5 font-semibold text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                if (video.user_id) navigate(`/player/${video.user_id}`);
              }}
            >
              {displayName}
            </span>
            {profile?.position && (
              <p className="text-xs text-foreground/60">
                {profile.position}
                {profile.team ? ` · ${profile.team}` : ""}
              </p>
            )}
          </div>
          {user && video.user_id && user.id !== video.user_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFollow();
              }}
              disabled={followLoading}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                isFollowing ? "bg-secondary/80 text-secondary-foreground" : "gradient-fire text-primary-foreground shadow-glow"
              }`}
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
              <span key={tag} className="text-xs text-primary font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-foreground/50">
          {formatNumber(video.views_count)} {t("feed.views")}
        </p>
      </div>

      <CommentsSheet videoId={video.id} open={commentsOpen} onOpenChange={setCommentsOpen} />
    </div>
  );
};

export default VideoCard;
