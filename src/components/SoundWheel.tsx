import { useState, useRef, useCallback } from "react";
import { Volume2, VolumeX, Volume1, Music2 } from "lucide-react";
import { useMute } from "@/contexts/MuteContext";
import { motion, AnimatePresence } from "framer-motion";

interface SoundWheelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

const SoundWheel = ({ videoRef }: SoundWheelProps) => {
  const { globalMuted, setGlobalMuted } = useMute();
  const [showSlider, setShowSlider] = useState(false);
  const [volume, setVolume] = useState(globalMuted ? 0 : 1);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleToggleMute = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const newMuted = !globalMuted;
    setGlobalMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
      if (!newMuted) {
        const vol = volume || 1;
        setVolume(vol);
        videoRef.current.volume = vol;
      }
    }
    setShowSlider(true);
    clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowSlider(false), 2000);
  };

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setGlobalMuted(val === 0);
    clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowSlider(false), 2000);
  }, [setGlobalMuted, videoRef]);

  const VolumeIcon = globalMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      className="flex flex-col items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <AnimatePresence>
        {showSlider && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 80 }}
            exit={{ opacity: 0, height: 0 }}
            className="relative flex items-center justify-center"
          >
            <div className="h-[80px] w-8 rounded-full bg-background/40 backdrop-blur-md flex items-center justify-center py-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={globalMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                style={{
                  writingMode: "vertical-lr" as any,
                  direction: "rtl",
                  width: "60px",
                  height: "60px",
                  appearance: "none",
                  background: "transparent",
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={handleToggleMute}
        className="relative h-11 w-11 rounded-full bg-background/30 backdrop-blur-sm ring-1 ring-border/60 overflow-hidden flex items-center justify-center"
        aria-label={globalMuted ? "Unmute" : "Mute"}
      >
        {globalMuted ? (
          <div className="h-full w-full flex items-center justify-center">
            <Music2 className="h-5 w-5 text-foreground/80" />
          </div>
        ) : (
          <VolumeIcon className="h-5 w-5 text-foreground/80" />
        )}
      </button>
    </div>
  );
};

export default SoundWheel;
