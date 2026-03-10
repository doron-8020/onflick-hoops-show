import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useViewTracker } from "@/hooks/useViewTracker";
import VideoCard from "@/components/VideoCard";

const ProfileFeed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const stateVideos = (location.state as any)?.videos || [];
  const startIndex = parseInt(searchParams.get("start") || "0", 10);

  const [videos, setVideos] = useState<any[]>(stateVideos);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackView = useViewTracker();

  useEffect(() => {
    if (videos.length === 0) {
      navigate("/profile");
      return;
    }
    if (user) {
      supabase
        .from("video_likes")
        .select("video_id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data) setLikedIds(new Set(data.map((l) => l.video_id)));
        });
    }
  }, [user, videos.length, navigate]);

  // Scroll to starting video on mount
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || startIndex === 0) return;
    const target = container.children[startIndex] as HTMLElement;
    if (target) target.scrollIntoView({ behavior: "instant" as ScrollBehavior });
  }, [startIndex]);

  // IntersectionObserver for auto-play and active tracking
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(index)) {
              setActiveIndex(index);
              if (videos[index]) trackView(videos[index].id);
            }
          }
          const videoEl = entry.target.querySelector("video");
          if (!videoEl) return;
          if (entry.isIntersecting) videoEl.play().catch(() => {});
          else videoEl.pause();
        });
      },
      { root: container, threshold: 0.8 }
    );
    const items = container.querySelectorAll("[data-video-card]");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [videos]);

  const renderWindow = useMemo(() => {
    return new Set([
      Math.max(0, activeIndex - 1),
      activeIndex,
      Math.min(videos.length - 1, activeIndex + 1),
    ]);
  }, [activeIndex, videos.length]);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto w-full max-w-lg relative h-full">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="fixed top-4 start-4 z-50 rounded-full bg-background/60 backdrop-blur-sm p-2"
        >
          <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
        </button>

        <div
          ref={scrollRef}
          className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        >
          {videos.map((video: any, i: number) => (
            <div
              key={video.id}
              data-video-card
              data-index={i}
              className="h-[100dvh] w-full snap-start snap-always"
            >
              {renderWindow.has(i) ? (
                <VideoCard
                  video={{
                    ...video,
                    profiles: video.profiles || {
                      display_name: null,
                      avatar_url: null,
                      position: null,
                      team: null,
                    },
                  }}
                  isLiked={likedIds.has(video.id)}
                />
              ) : (
                <div className="h-full w-full bg-background flex items-center justify-center">
                  <div className="animate-pulse rounded-full gradient-fire p-4">
                    <span className="font-display text-xl text-primary-foreground">🏀</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileFeed;
