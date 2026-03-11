import { Home, Search, Plus, Bell, User, MessageCircle, Settings, Globe } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DesktopSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isAdmin } = useAdmin();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { icon: Home, label: t("feed.foryou"), path: "/" },
    { icon: Search, label: t("nav.discover"), path: "/discover" },
    { icon: Plus, label: "Create", path: "/create" },
    { icon: Bell, label: t("nav.notifications"), path: "/notifications" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: User, label: t("nav.profile"), path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

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
      .channel("desktop-nav-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => setUnreadCount((prev) => prev + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (location.pathname === "/notifications") setUnreadCount(0);
  }, [location.pathname]);

  return (
    <aside className="hidden md:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 border-e border-border bg-background px-3 py-6">
      {/* Logo */}
      <Link to="/" className="px-3 mb-8">
        <span className="font-display text-2xl text-primary tracking-wider">ONFLICK</span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === "/" && location.pathname === "/");
          const isNotif = item.path === "/notifications";
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              <item.icon className="h-6 w-6 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.label}</span>
              {isNotif && unreadCount > 0 && (
                <span className="ms-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
        {/* Admin-only: Website editor link */}
        {isAdmin && (
          <Link
            to="/website"
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors mt-4 ${
              location.pathname === "/website"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <Globe className="h-6 w-6 shrink-0" strokeWidth={2} />
            <span>ONFLICK Website</span>
          </Link>
        )}
      </nav>

      {/* User avatar at bottom */}
      {user && (
        <Link to="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 transition-colors mt-auto">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground truncate">{user.email}</span>
        </Link>
      )}
    </aside>
  );
};

export default DesktopSidebar;
