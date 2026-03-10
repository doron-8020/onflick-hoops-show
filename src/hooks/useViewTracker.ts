import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks video views — increments views_count once per session per video.
 */
export const useViewTracker = () => {
  const viewedIds = useRef<Set<string>>(new Set());

  const trackView = useCallback((videoId: string) => {
    if (!videoId || viewedIds.current.has(videoId)) return;
    viewedIds.current.add(videoId);
    // Delay 3s so only meaningful views are counted
    setTimeout(() => {
      supabase.rpc("increment_views", { p_video_id: videoId }).then(() => {});
    }, 3000);
  }, []);

  return trackView;
};
