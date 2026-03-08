import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Ban, Snowflake, CheckCircle, Trash2, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  followers_count: number;
  following_count: number;
  bio: string | null;
  position: string | null;
  team: string | null;
}

const statusConfig = {
  active: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: { he: "פעיל", en: "Active" } },
  frozen: { icon: Snowflake, color: "text-blue-400", bg: "bg-blue-400/10", label: { he: "מוקפא", en: "Frozen" } },
  blocked: { icon: Ban, color: "text-destructive", bg: "bg-destructive/10", label: { he: "חסום", en: "Blocked" } },
};

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "frozen" | "blocked">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [isAdmin, adminLoading]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setUsers(data as unknown as UserProfile[]);
    setLoading(false);
  };

  const setUserStatus = async (userId: string, status: "active" | "frozen" | "blocked") => {
    setActionLoading(userId);
    const { error } = await supabase.rpc("admin_set_user_status", {
      p_user_id: userId,
      p_status: status,
    });
    if (error) {
      toast.error(language === "he" ? "שגיאה בעדכון סטטוס" : "Error updating status");
    } else {
      toast.success(language === "he" ? "הסטטוס עודכן" : "Status updated");
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, status } : u));
    }
    setActionLoading(null);
  };

  const deleteUserContent = async (userId: string) => {
    if (!confirm(language === "he" ? "האם אתה בטוח? כל התוכן של המשתמש יימחק לצמיתות." : "Are you sure? All user content will be permanently deleted.")) return;
    setActionLoading(userId);
    const { error } = await supabase.rpc("admin_delete_user_content", { p_user_id: userId });
    if (error) {
      toast.error(language === "he" ? "שגיאה במחיקת תוכן" : "Error deleting content");
    } else {
      toast.success(language === "he" ? "כל התוכן נמחק" : "All content deleted");
    }
    setActionLoading(null);
  };

  const filtered = users.filter((u) => {
    if (u.user_id === user?.id) return false; // don't show self
    const matchesSearch = !search || (u.display_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || u.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (adminLoading || (!isAdmin && !adminLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-glow rounded-full gradient-fire p-6">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-lg border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
        </button>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="font-display text-xl text-foreground tracking-wide">
          {language === "he" ? "ניהול משתמשים" : "User Management"}
        </h1>
        <span className="ms-auto text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {users.length}
        </span>
      </div>

      <div className="px-4 pt-16 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "he" ? "חפש משתמש..." : "Search user..."}
            className="w-full rounded-xl bg-card border border-border ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "active", "frozen", "blocked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {f === "all"
                ? language === "he" ? "הכל" : "All"
                : statusConfig[f].label[language]}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {(["active", "frozen", "blocked"] as const).map((s) => {
            const count = users.filter((u) => u.status === s).length;
            const cfg = statusConfig[s];
            return (
              <div key={s} className={`rounded-xl ${cfg.bg} p-3 text-center`}>
                <span className={`font-display text-xl ${cfg.color}`}>{count}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.label[language]}</p>
              </div>
            );
          })}
        </div>

        {/* User list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-card border border-border p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              {language === "he" ? "לא נמצאו משתמשים" : "No users found"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => {
              const cfg = statusConfig[u.status as keyof typeof statusConfig] || statusConfig.active;
              const StatusIcon = cfg.icon;
              const isProcessing = actionLoading === u.user_id;

              return (
                <div key={u.user_id} className="rounded-xl bg-card border border-border p-4 space-y-3">
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full gradient-fire flex items-center justify-center">
                          <span className="font-display text-sm text-primary-foreground">
                            {(u.display_name || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {u.display_name || "Unknown"}
                        </p>
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label[language]}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {u.position && `${u.position}`}{u.team && ` · ${u.team}`}
                        {!u.position && !u.team && (
                          new Date(u.created_at).toLocaleDateString(language === "he" ? "he-IL" : "en-US")
                        )}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-end">
                      {u.followers_count} {language === "he" ? "עוקבים" : "followers"}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {u.status !== "active" && (
                      <button
                        onClick={() => setUserStatus(u.user_id, "active")}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 py-2 text-xs font-semibold text-green-500 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {language === "he" ? "הפעל" : "Activate"}
                      </button>
                    )}
                    {u.status !== "frozen" && (
                      <button
                        onClick={() => setUserStatus(u.user_id, "frozen")}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-400/10 py-2 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-400/20 disabled:opacity-50"
                      >
                        <Snowflake className="h-3.5 w-3.5" />
                        {language === "he" ? "הקפא" : "Freeze"}
                      </button>
                    )}
                    {u.status !== "blocked" && (
                      <button
                        onClick={() => setUserStatus(u.user_id, "blocked")}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        {language === "he" ? "חסום" : "Block"}
                      </button>
                    )}
                    <button
                      onClick={() => deleteUserContent(u.user_id)}
                      disabled={isProcessing}
                      className="flex items-center justify-center rounded-lg bg-destructive/10 px-3 py-2 text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                      title={language === "he" ? "מחק את כל התוכן" : "Delete all content"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Admin;
