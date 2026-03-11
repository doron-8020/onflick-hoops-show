import { useRef, useState } from "react";
import { Play } from "lucide-react";

interface VideoFrameThumbProps {
  videoUrl: string;
  className?: string;
}

/**
 * Shows a video's first frame as a thumbnail by loading the video 
 * at t=0.1s with preload="auto". No canvas/CORS needed.
 */
const VideoFrameThumb = ({ videoUrl, className = "" }: VideoFrameThumbProps) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (failed) {
    return (
      <div className={`bg-secondary flex items-center justify-center ${className}`}>
        <Play className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl + "#t=0.1"}
      className={`${className} ${loaded ? "opacity-100" : "opacity-0"}`}
      style={{ background: "var(--secondary)" }}
      muted
      playsInline
      preload="auto"
      onLoadedData={() => {
        setLoaded(true);
        // Pause immediately to show just the frame
        videoRef.current?.pause();
      }}
      onError={() => setFailed(true)}
    />
  );
};

export default VideoFrameThumb;
