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
  reposts_count?: number;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    position: string | null;
    team: string | null;
    verified?: boolean;
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
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
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
  const touchStartX = useRef<number>(0);

  // Fetch blocked users
  useEffect(() => {
    if (!user) return;
    const fetchBlocked = async () => {
      const { data } = await supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id);
      if (data) setBlockedIds(new Set(data.map((b) => b.blocked_id)));
    };
    fetchBlocked();
  }, [user]);

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
      let typed = data as unknown as VideoWithProfile[];
      // Filter out blocked users
      if (blockedIds.size > 0) {
        typed = typed.filter((v) => !blockedIds.has(v.user_id));
      }
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
  }, [user, activeTab, blockedIds]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const next: FeedTab = tab === "following" ? "following" : "foryou";
    setActiveTab((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  useEffect(() => { setHasMore(true); fetchVideos(); }, [fetchVideos]);

  // Realtime: listen for new posts
  useEffect(() => {
    const channel = supabase
      .channel("new-videos-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "videos" }, (payload) => {
        const newRow = payload.new as any;
        if (latestCreatedAt.current && newRow.created_at > latestCreatedAt.current) {
          setNewPostsCount((c) => c + 1);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

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

  // Swipe between tabs
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      if (diff < 0 && activeTab === "foryou") navigate("/?tab=following");
      else if (diff > 0 && activeTab === "following") navigate("/");
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto w-full max-w-lg relative h-full">
        <FeedHeader />

        {/* New posts banner */}
        <AnimatePresence>
          {newPostsCount > 0 && (
            <motion.button
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              onClick={() => { scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); fetchVideos(); }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-full gradient-fire px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              {newPostsCount} {newPostsCount === 1 ? t("feed.newPost") : t("feed.newPosts")}
            </motion.button>
          )}
        </AnimatePresence>

        <PullToRefresh onRefresh={handleRefresh} className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative">
          <div ref={scrollRef} className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
            onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
          >
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
