import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks which video IDs have already been counted as viewed
 * and provides a function to record a view (once per session per video).
 */
export const useViewTracker = () => {
  const viewedIds = useRef<Set<string>>(new Set());

  const trackView = useCallback((videoId: string) => {
    if (viewedIds.current.has(videoId)) return;
    viewedIds.current.add(videoId);
    supabase
      .from("videos")
      .update({ views_count: supabase.rpc ? undefined : undefined })
      .eq("id", videoId)
      .then(() => {});
    // Use raw SQL increment via rpc or a simple +1 approach
    // Since we can't do views_count + 1 via .update() easily, use raw query:
    supabase.rpc("increment_views" as any, { p_video_id: videoId }).then(() => {});
  }, []);

  return trackView;
};
