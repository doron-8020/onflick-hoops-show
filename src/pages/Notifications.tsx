import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, UserPlus, Bell, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  video_id: string | null;
  from_user_id: string | null;
}

const typeIcons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
};

const typeColors: Record<string, string> = {
  like: "bg-primary/15 text-primary",
  comment: "bg-blue-500/15 text-blue-400",
  follow: "bg-green-500/15 text-green-400",
};

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("notifications.now");
    if (mins < 60) return language === "he" ? `לפני ${mins}${t("notifications.min")}` : `${mins}${t("notifications.min")} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return language === "he" ? `לפני ${hrs}${t("notifications.hour")}` : `${hrs}${t("notifications.hour")} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return language === "he" ? `לפני ${days} ${t("notifications.days")}` : `${days} ${t("notifications.days")} ago`;
    return language === "he" ? `לפני ${Math.floor(days / 7)} ${t("notifications.weeks")}` : `${Math.floor(days / 7)} ${t("notifications.weeks")} ago`;
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setLoading(false);
    };

    fetchNotifications();

    supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClick = (notif: Notification) => {
    if (notif.type === "follow" && notif.from_user_id) {
      navigate(`/player/${notif.from_user_id}`);
    } else if ((notif.type === "like" || notif.type === "comment") && notif.video_id) {
      navigate(`/?v=${notif.video_id}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="animate-pulse-glow rounded-full gradient-fire p-6">
          <span className="font-display text-2xl text-primary-foreground">🏀</span>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 pb-24">
        <div className="rounded-full bg-secondary p-6 mb-4">
          <Bell className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="font-display text-2xl text-foreground mb-2">{t("notifications.title")}</p>
        <p className="text-sm text-muted-foreground mb-6 text-center">{t("notifications.signInToSee")}</p>
        <button
          onClick={() => navigate("/auth")}
          className="rounded-xl gradient-fire px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          {t("auth.signIn")}
        </button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
        </button>
        <h1 className="font-display text-3xl text-foreground">{t("notifications.title")}</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="rounded-full bg-secondary p-5 mb-4">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-foreground font-semibold mb-1">{t("notifications.empty")}</p>
          <p className="text-muted-foreground text-xs text-center">{t("notifications.emptyDesc")}</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            const colorClass = typeColors[notif.type] || "bg-secondary text-muted-foreground";
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`flex items-start gap-3 px-4 py-4 transition-colors cursor-pointer active:bg-secondary/50 group ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div className={`rounded-full p-2 mt-0.5 shrink-0 ${colorClass}`}>
                  <Icon className="h-4 w-4" fill={notif.type === "like" ? "currentColor" : "none"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.created_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
                {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Notifications;
