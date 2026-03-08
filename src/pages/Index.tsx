import { mockVideos } from "@/data/mockData";
import VideoCard from "@/components/VideoCard";
import BottomNav from "@/components/BottomNav";
import logo from "@/assets/logo.png";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background via-background/80 to-transparent">
        <img src={logo} alt="ONFLICK SHOWCASE" className="h-8 w-auto" />
        <div className="flex gap-6">
          <button className="text-sm font-semibold text-muted-foreground">Following</button>
          <button className="text-sm font-semibold text-foreground border-b-2 border-primary pb-0.5">For You</button>
        </div>
        <div className="w-8" />
      </div>

      {/* Video Feed */}
      <div className="h-screen overflow-y-scroll snap-mandatory scrollbar-hide">
        {mockVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
