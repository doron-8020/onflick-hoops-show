import { useState } from "react";
import { Heart, MessageCircle, Share2, Play, BadgeCheck } from "lucide-react";
import type { VideoPost } from "@/data/mockData";

interface VideoCardMockProps {
  video: VideoPost;
}

const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

const VideoCardMock = ({ video }: VideoCardMockProps) => {
  const [liked, setLiked] = useState(video.liked);
  const [likes, setLikes] = useState(video.likes);
  const [showHeart, setShowHeart] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikes((prev) => prev + 1);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  return (
    <div className="relative h-screen w-full snap-start" onDoubleClick={handleDoubleTap}>
      <div className="absolute inset-0">
        <img src={video.thumbnail} alt={video.caption} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-background/30 p-4 backdrop-blur-sm">
          <Play className="h-12 w-12 text-foreground/80" fill="currentColor" />
        </div>
      </div>

      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className="h-24 w-24 text-primary animate-float-up" fill="currentColor" />
        </div>
      )}

      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`rounded-full p-2.5 ${liked ? "bg-primary/20" : "bg-background/30 backdrop-blur-sm"}`}>
            <Heart className={`h-7 w-7 transition-all ${liked ? "text-primary scale-110" : "text-foreground"}`} fill={liked ? "currentColor" : "none"} />
          </div>
          <span className="text-xs font-semibold text-foreground">{formatNumber(likes)}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-background/30 p-2.5 backdrop-blur-sm">
            <MessageCircle className="h-7 w-7 text-foreground" />
          </div>
          <span className="text-xs font-semibold text-foreground">{formatNumber(video.comments)}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-background/30 p-2.5 backdrop-blur-sm">
            <Share2 className="h-7 w-7 text-foreground" />
          </div>
          <span className="text-xs font-semibold text-foreground">{formatNumber(video.shares)}</span>
        </button>
      </div>

      <div className="absolute bottom-20 left-0 right-16 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-fire font-display text-lg text-primary-foreground">
            {video.player.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground text-sm">{video.player.name}</span>
              {video.player.verified && <BadgeCheck className="h-4 w-4 text-primary" fill="currentColor" />}
            </div>
            <span className="text-xs text-muted-foreground">{video.player.position} · {video.player.team}</span>
          </div>
          <button className="rounded-lg border border-primary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
            Follow
          </button>
        </div>
        <p className="text-sm text-foreground mb-2">{video.caption}</p>
        <div className="flex flex-wrap gap-1.5">
          {video.tags.map((tag) => (
            <span key={tag} className="text-xs text-primary font-medium">#{tag}</span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{video.views} views</p>
      </div>
    </div>
  );
};

export default VideoCardMock;
