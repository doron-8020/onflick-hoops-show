import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useViewTracker } from "@/hooks/useViewTracker";
import VideoCard from "@/components/VideoCard";
import BottomNav from "@/components/BottomNav";
import { ArrowRight } from "lucide-react";

interface VideoWithProfile {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  media_type: string;
  gallery_urls: string[] | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    position: string | null;
    team: string | null;
    verified?: boolean;
  } | null;
}

const TagFeed = () => {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackView = useViewTracker();

  useEffect(() => {
    if (!tagName) return;
    const fetchVideos = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("videos")
        .select("*, profiles!videos_user_id_fkey(display_name, avatar_url, position, team, verified)")
        .contains("tags", [tagName])
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setVideos(data as unknown as VideoWithProfile[]);
      if (user) {
        const { data: likes } = await supabase.from("video_likes").select("video_id").eq("user_id", user.id);
        if (likes) setLikedIds(new Set(likes.map((l) => l.video_id)));
      }
      setLoading(false);
    };
    fetchVideos();
  }, [tagName, user]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute("data-index"));
          if (!isNaN(index)) { setActiveIndex(index); if (videos[index]) trackView(videos[index].id); }
        }
        const videoEl = entry.target.querySelector("video");
        if (!videoEl) return;
        if (entry.isIntersecting) videoEl.play().catch(() => {}); else videoEl.pause();
      });
    }, { root: container, threshold: 0.8 });
    const items = container.querySelectorAll("[data-video-card]");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [videos, loading]);

  const renderWindow = useMemo(() => {
    return new Set([Math.max(0, activeIndex - 1), activeIndex, Math.min(videos.length - 1, activeIndex + 1)]);
  }, [activeIndex, videos.length]);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto w-full max-w-lg relative h-full">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 safe-top">
          <div className="mx-auto w-full max-w-lg flex items-center gap-3 px-4 py-3 bg-background/90 backdrop-blur-sm">
            <button onClick={() => navigate(-1)} className="p-1">
              <ArrowRight className={`h-5 w-5 text-foreground ${isRTL ? "" : "rotate-180"}`} />
            </button>
            <div>
              <h1 className="font-display text-lg text-foreground">#{tagName}</h1>
              <p className="text-xs text-muted-foreground">{videos.length} posts</p>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
          {loading ? (
            <div className="h-[100dvh] flex items-center justify-center">
              <div className="animate-pulse-glow rounded-full gradient-fire p-6">
                <span className="font-display text-2xl text-primary-foreground">🏀</span>
              </div>
            </div>
          ) : videos.length === 0 ? (
            <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 px-8">
              <p className="text-lg font-semibold text-foreground">No posts with #{tagName}</p>
            </div>
          ) : (
            videos.map((video, i) => (
              <div key={video.id} data-video-card data-index={i} className="h-[100dvh] w-full snap-start snap-always">
                {renderWindow.has(i) ? (
                  <VideoCard video={video} isLiked={likedIds.has(video.id)} />
                ) : (
                  <div className="h-full w-full bg-background flex items-center justify-center">
                    <div className="animate-pulse rounded-full gradient-fire p-4"><span className="font-display text-xl text-primary-foreground">🏀</span></div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default TagFeed;
