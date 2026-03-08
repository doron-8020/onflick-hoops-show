import { Settings, Grid3X3, Bookmark, BadgeCheck } from "lucide-react";
import { mockVideos } from "@/data/mockData";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const player = mockVideos[0].player;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <h1 className="font-display text-2xl text-foreground">{player.handle}</h1>
        <Settings className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center px-4 pb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-fire font-display text-3xl text-primary-foreground mb-3">
          {player.name.charAt(0)}
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="font-display text-2xl text-foreground">{player.name}</h2>
          {player.verified && <BadgeCheck className="h-5 w-5 text-primary" fill="currentColor" />}
        </div>
        <p className="text-sm text-muted-foreground mb-4">{player.position} · {player.team}</p>

        {/* Stats */}
        <div className="flex gap-8 mb-6">
          {[
            { label: "Posts", value: "47" },
            { label: "Followers", value: "12.5K" },
            { label: "Following", value: "234" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="font-display text-xl text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full max-w-xs">
          <button className="flex-1 rounded-xl gradient-fire py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            Edit Profile
          </button>
          <button className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground">
            Share
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button className="flex-1 flex justify-center py-3 border-b-2 border-primary">
          <Grid3X3 className="h-5 w-5 text-primary" />
        </button>
        <button className="flex-1 flex justify-center py-3">
          <Bookmark className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-0.5 px-0.5">
        {mockVideos.map((video) => (
          <div key={video.id} className="relative aspect-[9/16] overflow-hidden">
            <img src={video.thumbnail} alt={video.caption} className="h-full w-full object-cover" />
            <div className="absolute bottom-1 left-1">
              <span className="text-[10px] font-semibold text-foreground">{video.views}</span>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
