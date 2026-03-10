import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Search, X, UserPlus, UserCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFollow } from "@/hooks/useFollow";
import { useViewTracker } from "@/hooks/useViewTracker";
import VideoCard from "@/components/VideoCard";
import VideoThumbnail from "@/components/VideoThumbnail";
import BottomNav from "@/components/BottomNav";
import FeedHeader from "@/components/FeedHeader";

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

const PAGE_SIZE = 30;

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
    <div className="flex items-center gap-3 rounded-xl bg-secondary p-3 cursor-pointer transition-all hover:bg-secondary/80 active:scale-[0.98]" onClick={handleClick}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden">
        {player.avatar_url ? (
          <img src={player.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full gradient-fire flex items-center justify-center">
            <span className="font-display text-lg text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate">{[player.position, player.team].filter(Boolean).join(" · ") || t("discover.player")}</p>
        <p className="text-xs text-muted-foreground">{player.followers_count} {t("discover.followersCount")}</p>
      </div>
      {!isSelf && user && (
        <button onClick={(e) => { e.stopPropagation(); toggleFollow(); }} disabled={loading}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${isFollowing ? "bg-background text-foreground" : "gradient-fire text-primary-foreground shadow-glow"}`}
        >
          {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          {isFollowing ? t("video.followingBtn") : t("video.followBtn")}
        </button>
      )}
    </div>
  );
};

// Compact horizontal card for suggested
const SuggestedPlayerCard = ({ player }: { player: PlayerProfile }) => {
  const displayName = player.display_name || "Player";
  return (
    <a href={`/player/${player.user_id}`} className="shrink-0 w-28 flex flex-col items-center gap-2 rounded-xl bg-secondary p-3 hover:bg-secondary/80 transition-all">
      <div className="h-14 w-14 rounded-full overflow-hidden">
        {player.avatar_url ? (
          <img src={player.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full gradient-fire flex items-center justify-center">
            <span className="font-display text-lg text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-foreground truncate w-full text-center">{displayName}</p>
      <p className="text-[10px] text-muted-foreground">{player.followers_count} followers</p>
    </a>
  );
};

const Discover = () => {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const { t, isRTL, language } = useLanguage();
  const { user } = useAuth();

  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const trackView = useViewTracker();

  // Fetch top players
  useEffect(() => {
    const fetchTop = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, position, team, followers_count")
        .order("followers_count", { ascending: false })
        .limit(6);
      if (data) setTopPlayers(data as PlayerProfile[]);
    };
    fetchTop();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length >= 2) searchPlayers(query.trim());
      else setPlayers([]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const searchPlayers = async (q: string) => {
    setSearching(true);
    const term = `%${q}%`;
    const { data } = await supabase.from("profiles")
      .select("user_id, display_name, avatar_url, position, team, followers_count")
      .or(`display_name.ilike.${term},position.ilike.${term},team.ilike.${term}`)
      .order("followers_count", { ascending: false }).limit(20);
    setPlayers((data as PlayerProfile[]) || []);
    setSearching(false);
  };

  const fetchVideos = useCallback(async (offset = 0, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    const { data, error } = await supabase.from("videos")
      .select("*, profiles!videos_user_id_fkey(display_name, avatar_url, position, team, verified)")
      .order("views_count", { ascending: false }).order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (!error && data) {
      const typed = data as unknown as VideoWithProfile[];
      setVideos((prev) => append ? [...prev, ...typed] : typed);
      setHasMore(typed.length === PAGE_SIZE);
    }
    if (user) {
      const { data: likes } = await supabase.from("video_likes").select("video_id").eq("user_id", user.id);
      if (likes) setLikedIds(new Set(likes.map((l) => l.video_id)));
    }
    setLoading(false); setLoadingMore(false);
  }, [user]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  useEffect(() => {
    const handleScroll = () => {
      if (!gridRef.current || loadingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = gridRef.current;
      if (scrollHeight - scrollTop - clientHeight < 500) fetchVideos(videos.length, true);
    };
    const container = gridRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [videos.length, loadingMore, hasMore, fetchVideos]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const container = feedRef.current;
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
  }, [selectedIndex, videos]);

  const renderWindow = useMemo(() => {
    return new Set([Math.max(0, activeIndex - 1), activeIndex, Math.min(videos.length - 1, activeIndex + 1)]);
  }, [activeIndex, videos.length]);

  const openFullScreen = (index: number) => { setSelectedIndex(index); setActiveIndex(index); };
  const closeFullScreen = () => { setSelectedIndex(null); };

  const showSearch = query.trim().length >= 2;
  const isFullScreen = selectedIndex !== null;
  const heightClasses = ["aspect-[9/12]", "aspect-[9/16]", "aspect-[9/14]", "aspect-[9/11]"];
  const getHeightClass = (index: number) => heightClasses[index % heightClasses.length];

  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto w-full max-w-lg relative h-full">
        <FeedHeader />

        {showSearch && !isFullScreen && (
          <div className="fixed inset-0 z-40 bg-background pt-14">
            <div className="mx-auto max-w-lg px-4">
              <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 mb-4">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input type="text" placeholder={t("discover.searchPlaceholder")} value={query}
                  onChange={(e) => setQuery(e.target.value)} dir={isRTL ? "rtl" : "ltr"}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" autoFocus />
                <button onClick={() => setQuery("")} className="shrink-0 p-0.5"><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-2">
                {searching ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" /></div>
                ) : players.length > 0 ? (
                  <><p className="text-xs text-muted-foreground mb-2">{players.length} {t("discover.results")}</p>
                  {players.map((p) => <PlayerCard key={p.user_id} player={p} />)}</>
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

        {isFullScreen && (
          <div className="fixed inset-0 z-50 bg-background">
            <button onClick={closeFullScreen}
              className="absolute top-4 left-4 z-50 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-foreground shadow-lg">
              <ArrowRight className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />{t("discover.backToGrid")}
            </button>
            <div ref={feedRef} className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
              {videos.map((video, i) => (
                <div key={video.id} data-video-card data-index={i} className="h-[100dvh] w-full snap-start snap-always">
                  {renderWindow.has(i) ? <VideoCard video={video} isLiked={likedIds.has(video.id)} /> : (
                    <div className="h-full w-full bg-background flex items-center justify-center">
                      <div className="animate-pulse rounded-full gradient-fire p-4"><span className="font-display text-xl text-primary-foreground">🏀</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isFullScreen && (
          <div ref={gridRef} className="pt-14 pb-20 h-[100dvh] overflow-y-auto scrollbar-hide">
            {/* Search bar */}
            <div className="px-3 py-3">
              <div onClick={() => document.getElementById("search-input")?.focus()} className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 cursor-text">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input id="search-input" type="text" placeholder={t("discover.searchPlaceholder")} value={query}
                  onChange={(e) => setQuery(e.target.value)} dir={isRTL ? "rtl" : "ltr"}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              </div>
            </div>

            {/* Top Players */}
            {!showSearch && topPlayers.length > 0 && (
              <div className="px-4 pb-3">
                <h2 className="text-sm font-bold text-foreground mb-2">{language === "he" ? "שחקנים מובילים 🔥" : "Top Players 🔥"}</h2>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {topPlayers.map((p) => <SuggestedPlayerCard key={p.user_id} player={p} />)}
                </div>
              </div>
            )}

            {/* Trending header */}
            <div className="px-4 pb-3"><h2 className="text-lg font-bold text-foreground">{t("discover.trending")}</h2></div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-pulse-glow rounded-full gradient-fire p-6"><span className="font-display text-2xl text-primary-foreground">🏀</span></div>
              </div>
            ) : videos.length > 0 ? (
              <>
                <div className="columns-2 gap-2 px-2">
                  {videos.map((video, index) => (
                    <div key={video.id} className="mb-2 break-inside-avoid overflow-hidden rounded-xl bg-card cursor-pointer group" onClick={() => openFullScreen(index)}>
                      <div className={`relative w-full overflow-hidden ${getHeightClass(index)}`}>
                        <img src={video.thumbnail_url || (video.media_type === "image" ? video.video_url : "/placeholder.svg")}
                          alt={video.caption || ""} loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white/90 text-[11px] font-medium">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                          {video.views_count >= 1000 ? `${(video.views_count / 1000).toFixed(1)}K` : video.views_count}
                        </div>
                      </div>
                      <div className="p-2.5">
                        {video.caption && <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{video.caption}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-5 w-5 rounded-full overflow-hidden shrink-0">
                            {video.profiles?.avatar_url ? (
                              <img src={video.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full gradient-fire flex items-center justify-center">
                                <span className="text-[8px] text-primary-foreground font-bold">{(video.profiles?.display_name || "P").charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate">{video.profiles?.display_name || "Player"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {loadingMore && <div className="flex justify-center py-6"><div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="rounded-full bg-secondary p-6 mb-4"><Search className="h-10 w-10 text-muted-foreground" /></div>
                <p className="text-lg font-semibold text-foreground">{t("feed.noVideosYet")}</p>
              </div>
            )}
          </div>
        )}
      </div>
      {!isFullScreen && <BottomNav />}
    </div>
  );
};

export default Discover;
