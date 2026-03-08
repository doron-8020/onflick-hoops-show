import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Updates the PWA app badge on the home screen icon
 * with the number of unread notifications.
 */
export const useBadgeCount = () => {
  const { user } = useAuth();

  const updateBadge = async (count: number) => {
    try {
      if ("setAppBadge" in navigator) {
        if (count > 0) {
          await (navigator as any).setAppBadge(count);
        } else {
          await (navigator as any).clearAppBadge();
        }
      }
    } catch {
      // Badging API not supported or permission denied
    }
  };

  useEffect(() => {
    if (!user) {
      updateBadge(0);
      return;
    }

    const fetchAndSetBadge = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      updateBadge(count || 0);
    };

    fetchAndSetBadge();

    // Listen for new notifications
    const channel = supabase
      .channel("badge-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchAndSetBadge()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchAndSetBadge()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
