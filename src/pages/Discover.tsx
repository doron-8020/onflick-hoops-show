import { useState, useEffect } from "react";
import { Search, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { trendingTags, mockVideos } from "@/data/mockData";
import BottomNav from "@/components/BottomNav";

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
  const { isFollowing, toggleFollow, loading } = useFollow(player.user_id);
  const isSelf = user?.id === player.user_id;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full gradient-fire font-display text-lg text-primary-foreground">
        {(player.display_name || "P").charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{player.display_name || "Player"}</p>
        <p className="text-xs text-muted-foreground truncate">
          {[player.position, player.team].filter(Boolean).join(" · ") || "שחקן"}
        </p>
        <p className="text-xs text-muted-foreground">{player.followers_count} עוקבים</p>
      </div>
      {!isSelf && user && (
        <button
          onClick={toggleFollow}
          disabled={loading}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
            isFollowing
              ? "bg-background text-foreground"
              : "gradient-fire text-primary-foreground shadow-glow"
          }`}
        >
          {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          {isFollowing ? "עוקב" : "עקוב"}
        </button>
      )}
    </div>
  );
};

const Discover = () => {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [searching, setSearching] = useState(false);

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
      <div className="px-4 pt-14 pb-4">
        <h1 className="font-display text-3xl text-foreground tracking-wide">גלה</h1>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="חפש שחקנים, עמדות, קבוצות..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            dir="rtl"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {showResults ? (
        <div className="px-4 space-y-2">
          {searching ? (
            <p className="text-center text-sm text-muted-foreground py-8">מחפש...</p>
          ) : players.length > 0 ? (
            players.map((p) => <PlayerCard key={p.user_id} player={p} />)
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">לא נמצאו תוצאות</p>
          )}
        </div>
      ) : (
        <>
          {/* Trending Tags */}
          <div className="px-4 mb-6">
            <h2 className="font-display text-xl text-foreground mb-3">טרנדינג 🔥</h2>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="px-4">
            <h2 className="font-display text-xl text-foreground mb-3">הדגשות מובילות</h2>
            <div className="grid grid-cols-2 gap-2">
              {mockVideos.map((video) => (
                <div key={video.id} className="relative aspect-[9/16] overflow-hidden rounded-xl">
                  <img src={video.thumbnail} alt={video.caption} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-semibold text-foreground truncate">{video.player.name}</p>
                    <p className="text-[10px] text-muted-foreground">{video.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Discover;
