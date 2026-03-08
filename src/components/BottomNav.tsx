import { useEffect, useState } from "react";
import { Home, Search, Plus, Bell, User } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: Home, label: "בית", path: "/" },
  { icon: Search, label: "גלה", path: "/discover" },
  { icon: Plus, label: "צור", path: "/create", isCreate: true },
  { icon: Bell, label: "התראות", path: "/notifications" },
  { icon: User, label: "פרופיל", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel("nav-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => setUnreadCount((prev) => prev + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (location.pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  return (
    // FIX #17: Safe area padding for PWA/notch devices
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          if (item.isCreate) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center"
                aria-label="Create new highlight"
              >
                {/* FIX #18: Better create button with hover effect */}
                <div className="gradient-fire rounded-lg p-2.5 shadow-glow transition-transform active:scale-95">
                  <Plus className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
            );
          }

          const isNotif = item.path === "/notifications";

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1 active:scale-95 transition-transform"
              aria-label={item.label}
            >
              <item.icon
                className={`h-6 w-6 transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              {/* FIX #19: RTL Hebrew labels */}
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {/* FIX #20: Better notification badge */}
              {isNotif && unreadCount > 0 && (
                <span className="absolute -top-0.5 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground animate-scale-in">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
