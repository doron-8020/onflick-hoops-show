import { Play, Eye } from "lucide-react";
import VideoFrameThumb from "@/components/VideoFrameThumb";

interface VideoThumbnailProps {
  thumbnailUrl: string | null;
  videoUrl: string;
  viewsCount: number;
  mediaType: string;
  onClick: () => void;
}

const formatViews = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const VideoThumbnail = ({ thumbnailUrl, videoUrl, viewsCount, mediaType, onClick }: VideoThumbnailProps) => {
  const hasThumb = thumbnailUrl || mediaType === "image";
  const displayImage = thumbnailUrl || (mediaType === "image" ? videoUrl : null);

  return (
    <div
      onClick={onClick}
      className="relative aspect-[9/16] w-full cursor-pointer overflow-hidden bg-secondary group"
    >
      {displayImage ? (
        <img
          src={displayImage}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <VideoFrameThumb videoUrl={videoUrl} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Play icon (center) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="rounded-full bg-background/30 backdrop-blur-sm p-3">
          <Play className="h-6 w-6 text-white fill-white" />
        </div>
      </div>
      
      {/* Views count (bottom left) */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium">
        <Eye className="h-3.5 w-3.5" />
        <span>{formatViews(viewsCount)}</span>
      </div>
    </div>
  );
};

export default VideoThumbnail;
