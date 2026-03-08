import { useState, useRef, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const threshold = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, 120));
    }
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pulling, pullDistance, refreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div ref={containerRef} className={className}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center z-50 pointer-events-none transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance - 40}px)`, opacity: progress }}
      >
        <div className={`rounded-full bg-card border border-border p-2.5 shadow-card ${refreshing ? "animate-spin" : ""}`}>
          <div
            className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent"
            style={{ transform: refreshing ? undefined : `rotate(${progress * 360}deg)` }}
          />
        </div>
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
