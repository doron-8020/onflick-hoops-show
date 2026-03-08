import { Search } from "lucide-react";
import { trendingTags, mockVideos } from "@/data/mockData";
import BottomNav from "@/components/BottomNav";

const Discover = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-14 pb-4">
        <h1 className="font-display text-3xl text-foreground tracking-wide">Discover</h1>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search players, highlights..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Trending Tags */}
      <div className="px-4 mb-6">
        <h2 className="font-display text-xl text-foreground mb-3">Trending 🔥</h2>
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
        <h2 className="font-display text-xl text-foreground mb-3">Top Highlights</h2>
        <div className="grid grid-cols-2 gap-2">
          {mockVideos.map((video) => (
            <div key={video.id} className="relative aspect-[9/16] overflow-hidden rounded-xl">
              <img
                src={video.thumbnail}
                alt={video.caption}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-xs font-semibold text-foreground truncate">{video.player.name}</p>
                <p className="text-[10px] text-muted-foreground">{video.views} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Discover;
