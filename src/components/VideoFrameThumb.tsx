import { useRef, useState, useEffect } from "react";
import { Play } from "lucide-react";

interface VideoFrameThumbProps {
  videoUrl: string;
  className?: string;
}

/**
 * Renders a video and captures the first visible frame as a thumbnail.
 * Falls back to showing a paused video element.
 */
const VideoFrameThumb = ({ videoUrl, className = "" }: VideoFrameThumbProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const captureFrame = () => {
      try {
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 568;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          // Check if canvas actually has content (not blank)
          if (dataUrl && dataUrl.length > 1000) {
            setFrameUrl(dataUrl);
          }
        }
      } catch {
        // CORS or other error - just show the video element
        setFailed(false);
      }
    };

    video.addEventListener("seeked", captureFrame);
    video.addEventListener("error", () => setFailed(true));

    return () => {
      video.removeEventListener("seeked", captureFrame);
    };
  }, [videoUrl]);

  if (frameUrl) {
    return <img src={frameUrl} className={className} alt="" />;
  }

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <video
        ref={videoRef}
        src={videoUrl + "#t=0.1"}
        className={failed ? "hidden" : className}
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />
      {failed && (
        <div className={`bg-secondary flex items-center justify-center ${className}`}>
          <Play className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </>
  );
};

export default VideoFrameThumb;
