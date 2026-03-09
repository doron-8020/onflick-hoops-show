import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Search, X, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFollow } from "@/hooks/useFollow";
import { useMute } from "@/contexts/MuteContext";
import VideoCard from "@/components/VideoCard";
import BottomNav from "@/components/BottomNav";
import FeedHeader from "@/components/FeedHeader";
import PullToRefresh from "@/components/PullToRefresh";

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

interface PlayerProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  position: string | null;
  team: string | null;
  followers_count: number;
}

const PAGE_SIZE = 10;

const PlayerCard = ({ player }: { player: PlayerProfile }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isFollowing, toggleFollow, loading } = useFollow(player.user_id);
  const isSelf = user?.id === player.user_id;
  const displayName = player.display_name || "Player";

  const handleClick = () => {
    window.location.href = `/player/${player.user_id}`;
  };

  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-secondary p-3 cursor-pointer transition-all hover:bg-secondary/80 active:scale-[0.98]"
      onClick={handleClick}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden">
        {player.avatar_url ? (
          <img src={player.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full gradient-fire flex items-center justify-center">
            <span className="font-display text-lg text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {[player.position, player.team].filter(Boolean).join(" · ") || t("discover.player")}
        </p>
        <p className="text-xs text-muted-foreground">{player.followers_count} {t("discover.followersCount")}</p>
      </div>
      {!isSelf && user && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
          disabled={loading}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
            isFollowing
              ? "bg-background text-foreground"
              : "gradient-fire text-primary-foreground shadow-glow"
          }`}
        >
          {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          {isFollowing ? t("video.followingBtn") : t("video.followBtn")}
        </button>
      )}
    </div>
  );
};

const Discover = () => {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  // TikTok-style feed state
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Search logic
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchPlayers(query.trim());
      } else {
        setPlayers([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const searchPlayers = async (q: string) => {
    setSearching(true);
    const term = `%${q}%`;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, position, team, followers_count")
      .or(`display_name.ilike.${term},position.ilike.${term},team.ilike.${term}`)
      .order("followers_count", { ascending: false })
      .limit(20);
    setPlayers((data as PlayerProfile[]) || []);
    setSearching(false);
  };

  // Fetch videos for vertical feed
  const fetchVideos = useCallback(async (cursor?: string, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    
    let query = supabase
      .from("videos")
      .select("*, profiles!videos_user_id_fkey(display_name, avatar_url, position, team)")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    
    if (cursor) query = query.lt("created_at", cursor);
    
    const { data, error } = await query;
    if (!error && data) {
      const typed = data as unknown as VideoWithProfile[];
      setVideos((prev) => append ? [...prev, ...typed] : typed);
      setHasMore(typed.length === PAGE_SIZE);
    }
    
    if (user) {
      const { data: likes } = await supabase.from("video_likes").select("video_id").eq("user_id", user.id);
      if (likes) setLikedIds(new Set(likes.map((l) => l.video_id)));
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [user]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || videos.length === 0) return;
    const lastVideo = videos[videos.length - 1];
    if (lastVideo?.created_at) fetchVideos(lastVideo.created_at, true);
  }, [videos, loadingMore, hasMore, fetchVideos]);

  // Intersection observer for auto-play and infinite scroll
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
          }
        }
        const videoEl = entry.target.querySelector("video");
        if (!videoEl) return;
        if (entry.isIntersecting) videoEl.play().catch(() => {});
        else videoEl.pause();
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
  const showSearch = query.trim().length >= 2;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto w-full max-w-lg relative h-full">
        <FeedHeader />

        {/* Search overlay */}
        {showSearch && (
          <div className="fixed inset-0 z-40 bg-background pt-14">
            <div className="mx-auto max-w-lg px-4">
              <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 mb-4">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder={t("discover.searchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  dir={isRTL ? "rtl" : "ltr"}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  autoFocus
                />
                <button onClick={() => setQuery("")} className="shrink-0 p-0.5">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-2">
                {searching ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                  </div>
                ) : players.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      {players.length} {t("discover.results")}
                    </p>
                    {players.map((p) => (
                      <PlayerCard key={p.user_id} player={p} />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">{t("discover.noResults")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("discover.tryAnother")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TikTok-style vertical feed */}
        <PullToRefresh onRefresh={handleRefresh} className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative">
          <div ref={scrollRef} className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {loading ? (
              <div className="h-[100dvh] flex flex-col items-center justify-center gap-4">
                <div className="animate-pulse-glow rounded-full gradient-fire p-6">
                  <span className="font-display text-2xl text-primary-foreground">🏀</span>
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">{t("feed.loading")}</p>
              </div>
            ) : videos.length > 0 ? (
              <>
                {videos.map((video, i) => (
                  <div key={video.id} data-video-card data-index={i} className="h-[100dvh] w-full snap-start snap-always">
                    {renderWindow.has(i) ? (
                      <VideoCard video={video} isLiked={likedIds.has(video.id)} />
                    ) : (
                      <div className="h-full w-full bg-background flex items-center justify-center">
                        <div className="animate-pulse rounded-full gradient-fire p-4">
                          <span className="font-display text-xl text-primary-foreground">🏀</span>
                        </div>
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
              <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="rounded-full bg-secondary p-6 mb-2">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground">{t("feed.noVideosYet")}</p>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      <BottomNav />
    </div>
  );
};

export default Discover;
