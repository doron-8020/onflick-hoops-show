import { useEffect, useState } from "react";
import { Home, Search, Plus, MessageCircle, User, Bell } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const haptic = (ms = 15) => {
  try { if ("vibrate" in navigator) navigator.vibrate(ms); } catch {}
};

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const navItems = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: Search, label: t("nav.discover"), path: "/discover" },
    { icon: Plus, label: "", path: "/create", isCreate: true },
    { icon: MessageCircle, label: t("nav.messages"), path: "/messages" },
    { icon: User, label: t("nav.profile"), path: "/profile" },
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
      .channel("nav-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => setUnreadCount((prev) => prev + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadDMs = async () => {
      const { data: convos } = await supabase.from("conversations").select("id").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      if (!convos || convos.length === 0) { setUnreadMsgCount(0); return; }
      const ids = convos.map((c: any) => c.id);
      const { count } = await supabase.from("direct_messages").select("*", { count: "exact", head: true }).in("conversation_id", ids).neq("sender_id", user.id).eq("read", false);
      setUnreadMsgCount(count || 0);
    };
    fetchUnreadDMs();
    const ch = supabase.channel("nav-dm-unread").on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, () => fetchUnreadDMs()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    if (location.pathname === "/notifications") setUnreadCount(0);
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl safe-bottom">
      <div className="mx-auto max-w-lg flex items-center justify-around px-2 h-[56px] pb-[env(safe-area-inset-bottom,0px)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          if (item.isCreate) {
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => haptic(20)}
                className="flex flex-col items-center justify-center"
                aria-label="Create new highlight"
              >
                {/* TikTok-style rounded rect create button */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-[#25F4EE] translate-x-[-3px]" />
                  <div className="absolute inset-0 rounded-lg bg-[#FE2C55] translate-x-[3px]" />
                  <div className="relative rounded-lg bg-white px-3.5 py-1">
                    <Plus className="h-5 w-5 text-black" strokeWidth={2.5} />
                  </div>
                </div>
              </Link>
            );
          }

          const isNotif = item.path === "/notifications";
          const isMsg = item.path === "/messages";
          const badgeCount = isNotif ? unreadCount : isMsg ? unreadMsgCount : 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => haptic(10)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1 active:scale-95 transition-transform"
              aria-label={item.label}
            >
              <item.icon
                className={`h-6 w-6 transition-colors duration-200 ${isActive ? "text-white" : "text-white/50"}`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {item.label && (
                <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? "text-white" : "text-white/50"}`}>
                  {item.label}
                </span>
              )}
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 end-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FE2C55] px-1 text-[10px] font-bold text-white animate-scale-in">
                  {badgeCount > 99 ? "99+" : badgeCount}
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
