import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useViewTracker } from "@/hooks/useViewTracker";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import VideoCard from "@/components/VideoCard";
import BottomNav from "@/components/BottomNav";
import { mockVideos } from "@/data/mockData";
import VideoCardMock from "@/components/VideoCardMock";
import PullToRefresh from "@/components/PullToRefresh";
import { Search, ArrowUp } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FeedHeader from "@/components/FeedHeader";
import { motion, AnimatePresence } from "framer-motion";

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
  created_at?: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    position: string | null;
    team: string | null;
  } | null;
}

type FeedTab = "following" | "foryou";
const PAGE_SIZE = 10;

const Index = () => {
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<FeedTab>(() =>
    new URLSearchParams(window.location.search).get("tab") === "following" ? "following" : "foryou"
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackView = useViewTracker();
  const latestCreatedAt = useRef<string | null>(null);

  const fetchVideos = useCallback(async (cursor?: string, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    let query;
    if (activeTab === "following" && user) {
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const followingIds = follows?.map((f) => f.following_id) || [];
      if (followingIds.length === 0) { setVideos([]); setLoading(false); setHasMore(false); return; }
      query = supabase.from("videos").select("*, profiles!videos_user_id_fkey(display_name, avatar_url, position, team, verified)")
        .in("user_id", followingIds).order("created_at", { ascending: false }).limit(PAGE_SIZE);
    } else {
      query = supabase.from("videos").select("*, profiles!videos_user_id_fkey(display_name, avatar_url, position, team, verified)")
        .order("created_at", { ascending: false }).limit(PAGE_SIZE);
    }
    if (cursor) query = query.lt("created_at", cursor);
    const { data, error } = await query;
    if (!error && data) {
      const typed = data as unknown as VideoWithProfile[];
      setVideos((prev) => append ? [...prev, ...typed] : typed);
      setHasMore(typed.length === PAGE_SIZE);
      if (!append && typed.length > 0 && typed[0].created_at) {
        latestCreatedAt.current = typed[0].created_at;
      }
    }
    if (user) {
      const { data: likes } = await supabase.from("video_likes").select("video_id").eq("user_id", user.id);
      if (likes) setLikedIds(new Set(likes.map((l) => l.video_id)));
    }
    setLoading(false);
    setLoadingMore(false);
    setNewPostsCount(0);
  }, [user, activeTab]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const next: FeedTab = tab === "following" ? "following" : "foryou";
    setActiveTab((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  useEffect(() => { setHasMore(true); fetchVideos(); }, [fetchVideos]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || videos.length === 0) return;
    const lastVideo = videos[videos.length - 1];
    if (lastVideo?.created_at) fetchVideos(lastVideo.created_at, true);
  }, [videos, loadingMore, hasMore, fetchVideos]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute("data-index"));
          if (!isNaN(index)) {
            setActiveIndex(index);
            if (index >= videos.length - 3) loadMore();
            if (videos[index]) trackView(videos[index].id);
          }
        }
        const videoEl = entry.target.querySelector("video");
        if (!videoEl) return;
        if (entry.isIntersecting) videoEl.play().catch(() => {}); else videoEl.pause();
      });
    }, { root: container, threshold: 0.8 });
    const items = container.querySelectorAll("[data-video-card]");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [videos, loading, loadMore]);

  const renderWindow = useMemo(() => {
    return new Set([Math.max(0, activeIndex - 1), activeIndex, Math.min(videos.length - 1, activeIndex + 1)]);
  }, [activeIndex, videos.length]);

  const handleRefresh = async () => { setHasMore(true); await fetchVideos(); };
  const hasRealVideos = videos.length > 0;

  return (
    <div className="relative min-h-screen bg-background">
      {/* Desktop: centered feed container */}
      <div className="mx-auto w-full max-w-lg relative h-full">
        <FeedHeader />

        <PullToRefresh onRefresh={handleRefresh} className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative">
          <div ref={scrollRef} className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {loading ? (
              <div className="h-[100dvh] flex flex-col items-center justify-center gap-4">
                <div className="animate-pulse-glow rounded-full gradient-fire p-6">
                  <span className="font-display text-2xl text-primary-foreground">🏀</span>
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">{t("feed.loading")}</p>
              </div>
            ) : activeTab === "following" && !hasRealVideos ? (
              <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="rounded-full bg-secondary p-6 mb-2"><Search className="h-10 w-10 text-muted-foreground" /></div>
                <p className="text-lg font-semibold text-foreground">{t("feed.noVideosYet")}</p>
                <p className="text-sm text-muted-foreground">{t("feed.followToSee")}</p>
                <button onClick={() => navigate("/discover")} className="mt-2 rounded-xl bg-secondary px-6 py-2.5 text-sm font-semibold text-foreground">{t("feed.discoverPlayers")}</button>
              </div>
            ) : hasRealVideos ? (
              <>
                {videos.map((video, i) => (
                  <div key={video.id} data-video-card data-index={i} className="h-[100dvh] w-full snap-start snap-always">
                    {renderWindow.has(i) ? (
                      <VideoCard video={video} isLiked={likedIds.has(video.id)} />
                    ) : (
                      <div className="h-full w-full bg-background flex items-center justify-center">
                        <div className="animate-pulse rounded-full gradient-fire p-4"><span className="font-display text-xl text-primary-foreground">🏀</span></div>
                      </div>
                    )}
                  </div>
                ))}
                {loadingMore && (
                  <div className="h-20 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                )}
              </>
            ) : (
              mockVideos.map((video) => <VideoCardMock key={video.id} video={video} />)
            )}
          </div>
        </PullToRefresh>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
