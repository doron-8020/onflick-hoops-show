import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import VideoCard from "@/components/VideoCard";
import BottomNav from "@/components/BottomNav";
import { mockVideos } from "@/data/mockData";
import VideoCardMock from "@/components/VideoCardMock";

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

  useEffect(() => {
    fetchVideos();
  }, [user, activeTab]);

  const fetchVideos = async () => {
    setLoading(true);

    if (activeTab === "following" && user) {
      // Get followed user IDs first
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

      if (!error && data) {
        setVideos(data as unknown as VideoWithProfile[]);
      }
    } else {
      const { data, error } = await supabase
        .from("videos")
        .select("*, profiles!videos_user_id_fkey(display_name, avatar_url, position, team)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setVideos(data as unknown as VideoWithProfile[]);
      }
    }

    if (user) {
      const { data: likes } = await supabase
        .from("video_likes")
        .select("video_id")
        .eq("user_id", user.id);
      if (likes) {
        setLikedIds(new Set(likes.map((l) => l.video_id)));
      }
    }

    setLoading(false);
  };

  const hasRealVideos = videos.length > 0;

  return (
    <div className="relative min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-xl tracking-wider text-primary">ONFLICK</span>
          <span className="font-display text-xl tracking-wider text-foreground">SHOWCASE</span>
        </div>
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("following")}
            className={`text-sm font-semibold transition-colors ${
              activeTab === "following"
                ? "text-foreground border-b-2 border-primary pb-0.5"
                : "text-muted-foreground"
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setActiveTab("foryou")}
            className={`text-sm font-semibold transition-colors ${
              activeTab === "foryou"
                ? "text-foreground border-b-2 border-primary pb-0.5"
                : "text-muted-foreground"
            }`}
          >
            For You
          </button>
        </div>
        <div className="w-8" />
      </div>

      {/* Video Feed */}
      <div className="h-screen overflow-y-scroll snap-mandatory scrollbar-hide">
        {loading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="animate-pulse-glow rounded-full gradient-fire p-6">
              <span className="font-display text-2xl text-primary-foreground">🏀</span>
            </div>
          </div>
        ) : activeTab === "following" && !user ? (
          <div className="h-screen flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-lg font-semibold text-foreground">התחבר כדי לראות סרטונים מאנשים שאתה עוקב אחריהם</p>
            <p className="text-sm text-muted-foreground">עקוב אחרי שחקנים כדי לראות את התוכן שלהם כאן</p>
          </div>
        ) : activeTab === "following" && !hasRealVideos ? (
          <div className="h-screen flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-lg font-semibold text-foreground">אין עדיין סרטונים</p>
            <p className="text-sm text-muted-foreground">עקוב אחרי שחקנים כדי לראות את התוכן שלהם כאן</p>
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
