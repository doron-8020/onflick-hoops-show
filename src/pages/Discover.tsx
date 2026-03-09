import { useState, useEffect } from "react";
import { Search, UserPlus, UserCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFollow } from "@/hooks/useFollow";
import { trendingTags, mockVideos } from "@/data/mockData";
import BottomNav from "@/components/BottomNav";
import FeedHeader from "@/components/FeedHeader";

interface PlayerProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  position: string | null;
  team: string | null;
  followers_count: number;
}

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
      onClick={() => navigate(`/player/${player.user_id}`)}
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
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const { t, isRTL } = useLanguage();

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

  const showResults = query.trim().length >= 2;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-2xl">
        <div className="px-4 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
          </button>
          <h1 className="font-display text-3xl text-foreground tracking-wide">{t("discover.title")}</h1>
        </div>

        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder={t("discover.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              dir={isRTL ? "rtl" : "ltr"}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="shrink-0 p-0.5">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {showResults ? (
          <div className="px-4 space-y-2">
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
        ) : (
          <>
            <div className="px-4 mb-6">
              <h2 className="font-display text-xl text-foreground mb-3">{t("discover.trending")}</h2>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer active:scale-95"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-4">
              <h2 className="font-display text-xl text-foreground mb-3">{t("discover.topHighlights")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mockVideos.map((video) => (
                  <div key={video.id} className="relative aspect-[9/16] overflow-hidden rounded-xl group">
                    <img
                      src={video.thumbnail}
                      alt={video.caption}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-2 start-2 end-2">
                      <p className="text-xs font-semibold text-foreground truncate">{video.player.name}</p>
                      <p className="text-[10px] text-muted-foreground">{video.views} {t("feed.views")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Discover;
