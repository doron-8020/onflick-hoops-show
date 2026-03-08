import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Shield, Ban, Snowflake, CheckCircle, Trash2, Search, Users,
  BarChart3, Flag, BadgeCheck, Eye, Heart, MessageCircle, Video, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";

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
  verified: boolean;
}

interface Report {
  id: string;
  reporter_id: string;
  video_id: string;
  reason: string;
  status: string;
  created_at: string;
  videos?: { title: string; video_url: string; thumbnail_url: string | null; media_type: string; user_id: string } | null;
}

interface Analytics {
  totalUsers: number;
  newVideos24h: number;
  totalLikes: number;
  totalComments: number;
}

const statusConfig = {
  active: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: { he: "פעיל", en: "Active" } },
  frozen: { icon: Snowflake, color: "text-blue-400", bg: "bg-blue-400/10", label: { he: "מוקפא", en: "Frozen" } },
  blocked: { icon: Ban, color: "text-destructive", bg: "bg-destructive/10", label: { he: "חסום", en: "Blocked" } },
};

type AdminTab = "users" | "moderation" | "analytics" | "verified";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ totalUsers: 0, newVideos24h: 0, totalLikes: 0, totalComments: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "frozen" | "blocked">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) { navigate("/"); return; }
    fetchUsers();
    fetchReports();
    fetchAnalytics();
  }, [isAdmin, adminLoading]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data as unknown as UserProfile[]);
    setLoading(false);
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*, videos(title, video_url, thumbnail_url, media_type, user_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (data) setReports(data as unknown as Report[]);
  };

  const fetchAnalytics = async () => {
    const [{ count: totalUsers }, { count: newVideos24h }, { data: vids }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("videos").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      supabase.from("videos").select("likes_count, comments_count"),
    ]);
    const totalLikes = vids?.reduce((s, v) => s + (v.likes_count || 0), 0) || 0;
    const totalComments = vids?.reduce((s, v) => s + (v.comments_count || 0), 0) || 0;
    setAnalytics({ totalUsers: totalUsers || 0, newVideos24h: newVideos24h || 0, totalLikes, totalComments });
  };

  const setUserStatus = async (userId: string, status: "active" | "frozen" | "blocked") => {
    setActionLoading(userId);
    const { error } = await supabase.rpc("admin_set_user_status", { p_user_id: userId, p_status: status });
    if (error) toast.error(language === "he" ? "שגיאה בעדכון סטטוס" : "Error updating status");
    else {
      toast.success(language === "he" ? "הסטטוס עודכן" : "Status updated");
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, status } : u));
    }
    setActionLoading(null);
  };

  const deleteUserContent = async (userId: string) => {
    if (!confirm(language === "he" ? "האם אתה בטוח? כל התוכן יימחק לצמיתות." : "Are you sure? All content will be permanently deleted.")) return;
    setActionLoading(userId);
    const { error } = await supabase.rpc("admin_delete_user_content", { p_user_id: userId });
    if (error) toast.error(language === "he" ? "שגיאה" : "Error");
    else toast.success(language === "he" ? "כל התוכן נמחק" : "All content deleted");
    setActionLoading(null);
  };

  const toggleVerified = async (userId: string) => {
    setActionLoading(userId);
    const { data, error } = await supabase.rpc("admin_toggle_verified", { p_user_id: userId });
    if (error) toast.error(language === "he" ? "שגיאה" : "Error");
    else {
      toast.success(data ? (language === "he" ? "אומת ✓" : "Verified ✓") : (language === "he" ? "האימות הוסר" : "Unverified"));
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, verified: !!data } : u));
    }
    setActionLoading(null);
  };

  const resolveReport = async (reportId: string) => {
    setActionLoading(reportId);
    const { error } = await supabase.from("reports").update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: user?.id }).eq("id", reportId);
    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success(language === "he" ? "הדיווח נפתר" : "Report resolved");
    }
    setActionLoading(null);
  };

  const deleteReportedVideo = async (reportId: string, videoId: string) => {
    if (!confirm(language === "he" ? "למחוק את הסרטון?" : "Delete this video?")) return;
    setActionLoading(reportId);
    await supabase.from("videos").delete().eq("id", videoId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    toast.success(language === "he" ? "הסרטון נמחק" : "Video deleted");
    setActionLoading(null);
  };

  const filtered = users.filter((u) => {
    if (u.user_id === user?.id) return false;
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

  const tabs: { key: AdminTab; icon: typeof Users; label: string }[] = [
    { key: "users", icon: Users, label: t("admin.users") },
    { key: "moderation", icon: Flag, label: t("admin.moderation") },
    { key: "analytics", icon: BarChart3, label: t("admin.analytics") },
    { key: "verified", icon: BadgeCheck, label: t("admin.verified") },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
          </button>
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-display text-xl text-foreground tracking-wide">{t("admin.title")}</h1>
        </div>
        {/* Tabs */}
        <div className="relative flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors relative ${
                activeTab === tab.key ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="adminTabIndicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-28 space-y-4">
        {/* USERS TAB */}
        {activeTab === "users" && (
          <>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === "he" ? "חפש משתמש..." : "Search user..."}
                className="w-full rounded-xl bg-card border border-border ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "active", "frozen", "blocked"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  {f === "all" ? (language === "he" ? "הכל" : "All") : statusConfig[f].label[language]}
                </button>
              ))}
            </div>
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
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="rounded-xl bg-card border border-border p-4 animate-pulse h-24" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">{language === "he" ? "לא נמצאו משתמשים" : "No users found"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((u) => {
                  const cfg = statusConfig[u.status as keyof typeof statusConfig] || statusConfig.active;
                  const StatusIcon = cfg.icon;
                  const isProcessing = actionLoading === u.user_id;
                  return (
                    <div key={u.user_id} className="rounded-xl bg-card border border-border p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full gradient-fire flex items-center justify-center">
                              <span className="font-display text-sm text-primary-foreground">{(u.display_name || "?").charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-sm truncate">{u.display_name || "Unknown"}</p>
                            {u.verified && <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />}
                            <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                              <StatusIcon className="h-3 w-3" />{cfg.label[language]}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {u.position && `${u.position}`}{u.team && ` · ${u.team}`}
                            {!u.position && !u.team && new Date(u.created_at).toLocaleDateString(language === "he" ? "he-IL" : "en-US")}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-end">{u.followers_count} {language === "he" ? "עוקבים" : "followers"}</p>
                      </div>
                      <div className="flex gap-2">
                        {u.status !== "active" && (
                          <button onClick={() => setUserStatus(u.user_id, "active")} disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 py-2 text-xs font-semibold text-green-500 disabled:opacity-50">
                            <CheckCircle className="h-3.5 w-3.5" />{language === "he" ? "הפעל" : "Activate"}
                          </button>
                        )}
                        {u.status !== "frozen" && (
                          <button onClick={() => setUserStatus(u.user_id, "frozen")} disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-400/10 py-2 text-xs font-semibold text-blue-400 disabled:opacity-50">
                            <Snowflake className="h-3.5 w-3.5" />{language === "he" ? "הקפא" : "Freeze"}
                          </button>
                        )}
                        {u.status !== "blocked" && (
                          <button onClick={() => setUserStatus(u.user_id, "blocked")} disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 py-2 text-xs font-semibold text-destructive disabled:opacity-50">
                            <Ban className="h-3.5 w-3.5" />{language === "he" ? "חסום" : "Block"}
                          </button>
                        )}
                        <button onClick={() => deleteUserContent(u.user_id)} disabled={isProcessing}
                          className="flex items-center justify-center rounded-lg bg-destructive/10 px-3 py-2 text-destructive disabled:opacity-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* MODERATION TAB */}
        {activeTab === "moderation" && (
          <>
            <div className="rounded-xl bg-primary/10 p-4 flex items-center gap-3">
              <Flag className="h-6 w-6 text-primary" />
              <div>
                <p className="font-display text-lg text-foreground">{reports.length}</p>
                <p className="text-xs text-muted-foreground">{t("admin.pendingReports")}</p>
              </div>
            </div>
            {reports.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="h-12 w-12 text-green-500/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{t("admin.noReports")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {r.videos && (
                        <div className="h-16 w-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {r.videos.media_type === "image" ? (
                            <img src={r.videos.thumbnail_url || r.videos.video_url} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <video src={r.videos.video_url} className="h-full w-full object-cover" muted preload="metadata" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{r.videos?.title || "Video"}</p>
                        <p className="text-xs text-muted-foreground">{language === "he" ? "סיבה:" : "Reason:"} {r.reason}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(r.created_at).toLocaleDateString(language === "he" ? "he-IL" : "en-US")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => resolveReport(r.id)} disabled={actionLoading === r.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 py-2 text-xs font-semibold text-green-500 disabled:opacity-50">
                        <CheckCircle className="h-3.5 w-3.5" />{t("admin.resolve")}
                      </button>
                      <button onClick={() => deleteReportedVideo(r.id, r.video_id)} disabled={actionLoading === r.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 py-2 text-xs font-semibold text-destructive disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" />{t("admin.deleteVideo")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: t("admin.totalUsers"), value: analytics.totalUsers, color: "text-primary", bg: "bg-primary/10" },
              { icon: Video, label: t("admin.newVideos24h"), value: analytics.newVideos24h, color: "text-green-500", bg: "bg-green-500/10" },
              { icon: Heart, label: t("admin.totalEngagement") + " ❤️", value: analytics.totalLikes, color: "text-pink-500", bg: "bg-pink-500/10" },
              { icon: MessageCircle, label: t("admin.totalEngagement") + " 💬", value: analytics.totalComments, color: "text-blue-400", bg: "bg-blue-400/10" },
            ].map((stat, i) => (
              <div key={i} className={`rounded-xl ${stat.bg} p-4 space-y-2`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                <p className={`font-display text-2xl ${stat.color}`}>{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* VERIFIED TAB */}
        {activeTab === "verified" && (
          <>
            <div className="rounded-xl bg-primary/10 p-4 flex items-center gap-3">
              <BadgeCheck className="h-6 w-6 text-primary" />
              <div>
                <p className="font-display text-lg text-foreground">{users.filter(u => u.verified).length}</p>
                <p className="text-xs text-muted-foreground">{language === "he" ? "משתמשים מאומתים" : "Verified Users"}</p>
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === "he" ? "חפש משתמש..." : "Search user..."}
                className="w-full rounded-xl bg-card border border-border ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              {users
                .filter(u => u.user_id !== user?.id && (!search || (u.display_name || "").toLowerCase().includes(search.toLowerCase())))
                .map((u) => (
                  <div key={u.user_id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full gradient-fire flex items-center justify-center">
                          <span className="font-display text-sm text-primary-foreground">{(u.display_name || "?").charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-foreground text-sm truncate">{u.display_name || "Unknown"}</p>
                        {u.verified && <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{u.followers_count} {language === "he" ? "עוקבים" : "followers"}</p>
                    </div>
                    <button
                      onClick={() => toggleVerified(u.user_id)}
                      disabled={actionLoading === u.user_id}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                        u.verified
                          ? "bg-secondary text-secondary-foreground"
                          : "gradient-fire text-primary-foreground shadow-glow"
                      }`}
                    >
                      {u.verified ? t("admin.removeVerified") : t("admin.giveVerified")}
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Admin;
