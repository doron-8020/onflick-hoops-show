import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface GalleryCarouselProps {
  urls: string[];
  alt?: string;
}

const GalleryCarousel = ({ urls, alt = "" }: GalleryCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(urls.length - 1, index)));
    },
    [urls.length]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }
    touchDeltaX.current = 0;
  };

  if (urls.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="flex h-full"
        animate={{ x: `-${activeIndex * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {urls.map((url, i) => (
          <div key={i} className="h-full w-full shrink-0">
            <img
              src={url}
              className="h-full w-full object-cover"
              alt={`${alt} ${i + 1}`}
              loading={i <= 1 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </motion.div>

      {/* Dots */}
      {urls.length > 1 && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1 z-10">
          {urls.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-foreground/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {urls.length > 1 && (
        <div className="absolute top-16 end-4 z-10 rounded-full bg-background/50 px-2.5 py-1 backdrop-blur-sm safe-top">
          <span className="text-xs font-semibold text-foreground">
            {activeIndex + 1}/{urls.length}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/30 pointer-events-none" />
    </div>
  );
};

export default GalleryCarousel;
