import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Check, Bell } from "lucide-react";
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

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Mark all as read
    supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then();

    // Realtime subscription
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 pb-24">
        <Bell className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="font-display text-2xl text-foreground mb-4">Sign In for Notifications</p>
        <button onClick={() => navigate("/auth")} className="rounded-xl gradient-fire px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow">
          Sign In
        </button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-14 pb-4">
        <h1 className="font-display text-3xl text-foreground">Notifications</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse-glow rounded-full gradient-fire p-4">
            <Bell className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <Bell className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm text-center">No notifications yet</p>
          <p className="text-muted-foreground text-xs text-center mt-1">When someone likes your highlights, you'll see it here</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-3 px-4 py-4 transition-colors ${!notif.read ? "bg-primary/5" : ""}`}
              >
                <div className={`rounded-full p-2 mt-0.5 ${notif.type === "like" ? "bg-primary/15" : "bg-secondary"}`}>
                  <Icon className={`h-4 w-4 ${notif.type === "like" ? "text-primary" : "text-muted-foreground"}`} fill={notif.type === "like" ? "currentColor" : "none"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(notif.created_at)}</p>
                </div>
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
