import { useEffect } from "react";
import { Music2 } from "lucide-react";
import { useMute } from "@/contexts/MuteContext";

interface SoundWheelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying?: boolean;
  thumbnailUrl?: string | null;
}

const SoundWheel = ({ videoRef, isPlaying = true, thumbnailUrl }: SoundWheelProps) => {
  const { globalMuted, setGlobalMuted } = useMute();

  // Sync video muted state with global
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = globalMuted;
    }
  }, [globalMuted, videoRef]);

  const handleToggleMute = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const newMuted = !globalMuted;
    setGlobalMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  return (
    <button
      onClick={handleToggleMute}
      onTouchEnd={(e) => { e.preventDefault(); handleToggleMute(e); }}
      className={`relative h-11 w-11 rounded-full bg-background/30 backdrop-blur-sm ring-1 ring-border/60 overflow-hidden ${
        isPlaying && !globalMuted
          ? "motion-safe:animate-spin motion-reduce:animate-none motion-safe:[animation-duration:4.5s]"
          : ""
      }`}
      aria-label={globalMuted ? "Unmute" : "Mute"}
    >
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className="h-full w-full object-cover opacity-80" loading="lazy" />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <Music2 className="h-5 w-5 text-foreground/80" />
        </div>
      )}
      <div className="absolute inset-0 rounded-full ring-2 ring-background/60" />
      {globalMuted && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40">
          <div className="h-[2px] w-7 bg-foreground/70 rotate-45 rounded-full" />
        </div>
      )}
    </button>
  );
};

export default SoundWheel;
