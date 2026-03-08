import { useState } from "react";
import { Heart, MessageCircle, Share2, Play, Pause, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CommentsSheet from "./CommentsSheet";

interface VideoCardProps {
  video: {
    id: string;
    video_url: string;
    thumbnail_url: string | null;
    caption: string | null;
    tags: string[] | null;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    views_count: number;
    media_type?: string;
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

const VideoCard = ({ video, isLiked: initialLiked = false }: VideoCardProps) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(video.likes_count);
  const [showHeart, setShowHeart] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((prev) => (newLiked ? prev + 1 : prev - 1));

    const { error } = await supabase.rpc("toggle_video_like", { p_video_id: video.id });
    if (error) {
      setLiked(!newLiked);
      setLikes((prev) => (newLiked ? prev - 1 : prev + 1));
      toast.error("Failed to update like");
    }
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const togglePlay = (e: React.MouseEvent) => {
    const videoEl = (e.currentTarget as HTMLElement).querySelector("video");
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play();
      setPlaying(true);
    } else {
      videoEl.pause();
      setPlaying(false);
    }
  };

  const profile = video.profiles;
  const displayName = profile?.display_name || "Player";

  return (
    <div
      className="relative h-screen w-full snap-start"
      onDoubleClick={handleDoubleTap}
      onClick={togglePlay}
    >
      {/* Media */}
      <div className="absolute inset-0">
        {video.media_type === "image" ? (
          <img
            src={video.video_url}
            className="h-full w-full object-cover"
            alt={video.caption || ""}
          />
        ) : (
          <video
            src={video.video_url}
            className="h-full w-full object-cover"
            loop
            playsInline
            muted
            poster={video.thumbnail_url || undefined}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* Play/Pause indicator (video only) */}
      {video.media_type !== "image" && !playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full bg-background/30 p-4 backdrop-blur-sm">
            <Play className="h-12 w-12 text-foreground/80" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Double tap heart */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className="h-24 w-24 text-primary animate-float-up" fill="currentColor" />
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`rounded-full p-2.5 ${liked ? "bg-primary/20" : "bg-background/30 backdrop-blur-sm"}`}>
            <Heart className={`h-7 w-7 transition-all ${liked ? "text-primary scale-110" : "text-foreground"}`} fill={liked ? "currentColor" : "none"} />
          </div>
          <span className="text-xs font-semibold text-foreground">{formatNumber(likes)}</span>
        </button>

        <button onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-background/30 p-2.5 backdrop-blur-sm">
            <MessageCircle className="h-7 w-7 text-foreground" />
          </div>
          <span className="text-xs font-semibold text-foreground">{formatNumber(video.comments_count)}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-background/30 p-2.5 backdrop-blur-sm">
            <Share2 className="h-7 w-7 text-foreground" />
          </div>
          <span className="text-xs font-semibold text-foreground">{formatNumber(video.shares_count)}</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-20 left-0 right-16 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-fire font-display text-lg text-primary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-foreground text-sm">{displayName}</span>
            {profile?.position && (
              <p className="text-xs text-muted-foreground">
                {profile.position}{profile.team ? ` · ${profile.team}` : ""}
              </p>
            )}
          </div>
        </div>

        {video.caption && <p className="text-sm text-foreground mb-2">{video.caption}</p>}

        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.tags.map((tag) => (
              <span key={tag} className="text-xs text-primary font-medium">#{tag}</span>
            ))}
          </div>
        )}

        <p className="mt-2 text-xs text-muted-foreground">{formatNumber(video.views_count)} views</p>
      </div>

      <CommentsSheet videoId={video.id} open={commentsOpen} onOpenChange={setCommentsOpen} />
    </div>
  );
};

export default VideoCard;
