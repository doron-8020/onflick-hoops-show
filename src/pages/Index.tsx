import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import VideoCard from "@/components/VideoCard";
import BottomNav from "@/components/BottomNav";
import { mockVideos } from "@/data/mockData";
import VideoCardMock from "@/components/VideoCardMock";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    position: string | null;
    team: string | null;
  } | null;
}

type FeedTab = "foryou" | "following";

const Index = () => {
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>("foryou");
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVideos();
  }, [user, activeTab]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoEl = entry.target.querySelector("video");
          if (!videoEl) return;
          if (entry.isIntersecting) {
            videoEl.play().catch(() => {});
          } else {
            videoEl.pause();
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    const items = container.querySelectorAll("[data-video-card]");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [videos, loading]);

  const fetchVideos = async () => {
    setLoading(true);

    if (activeTab === "following" && user) {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = follows?.map((f) => f.following_id) || [];

      if (followingIds.length === 0) {
        setVideos([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("videos")
        .select("*, profiles!videos_user_id_fkey(display_name, avatar_url, position, team)")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false });

      if (!error && data) setVideos(data as unknown as VideoWithProfile[]);
    } else {
      const { data, error } = await supabase
        .from("videos")
        .select("*, profiles!videos_user_id_fkey(display_name, avatar_url, position, team)")
        .order("created_at", { ascending: false });

      if (!error && data) setVideos(data as unknown as VideoWithProfile[]);
    }

    if (user) {
      const { data: likes } = await supabase
        .from("video_likes")
        .select("video_id")
        .eq("user_id", user.id);
      if (likes) setLikedIds(new Set(likes.map((l) => l.video_id)));
    }

    setLoading(false);
  };

  const hasRealVideos = videos.length > 0;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background via-background/80 to-transparent safe-top">
        <button
          onClick={() => navigate("/discover")}
          className="p-1 rounded-full hover:bg-secondary/50 transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("following")}
            className={`text-sm font-semibold transition-all duration-200 pb-0.5 ${
              activeTab === "following"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {t("feed.following")}
          </button>
          <button
            onClick={() => setActiveTab("foryou")}
            className={`text-sm font-semibold transition-all duration-200 pb-0.5 ${
              activeTab === "foryou"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {t("feed.foryou")}
          </button>
        </div>
        <div className="w-7" />
      </div>

      <div
        ref={scrollRef}
        className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {loading ? (
          <div className="h-[100dvh] flex flex-col items-center justify-center gap-4">
            <div className="animate-pulse-glow rounded-full gradient-fire p-6">
              <span className="font-display text-2xl text-primary-foreground">🏀</span>
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">{t("feed.loading")}</p>
          </div>
        ) : activeTab === "following" && !user ? (
          <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="rounded-full bg-secondary p-6 mb-2">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">{t("feed.loginToSee")}</p>
            <p className="text-sm text-muted-foreground">{t("feed.followToSee")}</p>
            <button
              onClick={() => navigate("/auth")}
              className="mt-2 rounded-xl gradient-fire px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow"
            >
              {t("auth.signIn")}
            </button>
          </div>
        ) : activeTab === "following" && !hasRealVideos ? (
          <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="rounded-full bg-secondary p-6 mb-2">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">{t("feed.noVideosYet")}</p>
            <p className="text-sm text-muted-foreground">{t("feed.followToSee")}</p>
            <button
              onClick={() => navigate("/discover")}
              className="mt-2 rounded-xl bg-secondary px-6 py-2.5 text-sm font-semibold text-foreground"
            >
              {t("feed.discoverPlayers")}
            </button>
          </div>
        ) : hasRealVideos ? (
          videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isLiked={likedIds.has(video.id)}
            />
          ))
        ) : (
          mockVideos.map((video) => (
            <VideoCardMock key={video.id} video={video} />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
