import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Eye, Heart, MessageCircle, Share2, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";
import DesktopLayout from "@/components/DesktopLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

interface VideoStats {
  id: string;
  title: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reposts_count: number;
  created_at: string;
}

const Analytics = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("videos")
        .select("id, title, views_count, likes_count, comments_count, shares_count, reposts_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setVideos((data as VideoStats[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totals = useMemo(() => {
    return videos.reduce(
      (acc, v) => ({
        views: acc.views + v.views_count,
        likes: acc.likes + v.likes_count,
        comments: acc.comments + v.comments_count,
        shares: acc.shares + v.shares_count,
        engagementRate:
          acc.views + v.views_count > 0
            ? ((acc.likes + v.likes_count + acc.comments + v.comments_count + acc.shares + v.shares_count) /
                (acc.views + v.views_count)) *
              100
            : 0,
      }),
      { views: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0 }
    );
  }, [videos]);

  // Group videos by week for trend chart
  const trendData = useMemo(() => {
    if (videos.length === 0) return [];
    const weeks: Record<string, { week: string; views: number; likes: number; comments: number }> = {};
    videos.forEach((v) => {
      const d = new Date(v.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!weeks[key]) weeks[key] = { week: key, views: 0, likes: 0, comments: 0 };
      weeks[key].views += v.views_count;
      weeks[key].likes += v.likes_count;
      weeks[key].comments += v.comments_count;
    });
    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week)).slice(-12);
  }, [videos]);

  // Top 5 posts by views
  const topPosts = useMemo(() => {
    return [...videos].sort((a, b) => b.views_count - a.views_count).slice(0, 5).map((v) => ({
      name: v.title.length > 15 ? v.title.slice(0, 15) + "…" : v.title,
      views: v.views_count,
      likes: v.likes_count,
    }));
  }, [videos]);

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const statCards = [
    { label: language === "he" ? "צפיות" : "Views", value: totals.views, icon: Eye, color: "text-blue-400" },
    { label: language === "he" ? "לייקים" : "Likes", value: totals.likes, icon: Heart, color: "text-primary" },
    { label: language === "he" ? "תגובות" : "Comments", value: totals.comments, icon: MessageCircle, color: "text-green-400" },
    { label: language === "he" ? "שיתופים" : "Shares", value: totals.shares, icon: Share2, color: "text-purple-400" },
  ];

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="font-display text-xl text-foreground">
            {language === "he" ? "אנליטיקס" : "Analytics"}
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="rounded-full bg-secondary p-4 mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold mb-1">
              {language === "he" ? "אין נתונים עדיין" : "No data yet"}
            </p>
            <p className="text-muted-foreground text-sm">
              {language === "he" ? "העלה סרטונים כדי לראות סטטיסטיקות" : "Upload videos to see your stats"}
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="font-display text-2xl text-foreground">{formatNum(stat.value)}</p>
                </div>
              ))}
            </div>

            {/* Engagement rate */}
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">
                  {language === "he" ? "שיעור מעורבות" : "Engagement Rate"}
                </span>
              </div>
              <p className="font-display text-3xl text-foreground">
                {totals.engagementRate.toFixed(1)}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {language === "he"
                  ? "(לייקים + תגובות + שיתופים) / צפיות"
                  : "(likes + comments + shares) / views"}
              </p>
            </div>

            {/* Trend chart */}
            {trendData.length > 1 && (
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {language === "he" ? "מגמות שבועיות" : "Weekly Trends"}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10, fill: "hsl(0 0% 55%)" }}
                        tickFormatter={(v) => {
                          const d = new Date(v);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 55%)" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0 0% 8%)",
                          border: "1px solid hsl(0 0% 16%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(0 0% 95%)",
                        }}
                      />
                      <Line type="monotone" dataKey="views" stroke="hsl(210 100% 70%)" strokeWidth={2} dot={false} name={language === "he" ? "צפיות" : "Views"} />
                      <Line type="monotone" dataKey="likes" stroke="hsl(0 85% 50%)" strokeWidth={2} dot={false} name={language === "he" ? "לייקים" : "Likes"} />
                      <Line type="monotone" dataKey="comments" stroke="hsl(140 70% 50%)" strokeWidth={2} dot={false} name={language === "he" ? "תגובות" : "Comments"} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top posts bar chart */}
            {topPosts.length > 0 && (
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {language === "he" ? "הפוסטים המובילים" : "Top Posts"}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPosts} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(0 0% 55%)" }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(0 0% 55%)" }} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0 0% 8%)",
                          border: "1px solid hsl(0 0% 16%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(0 0% 95%)",
                        }}
                      />
                      <Bar dataKey="views" fill="hsl(210 100% 70%)" radius={[0, 4, 4, 0]} name={language === "he" ? "צפיות" : "Views"} />
                      <Bar dataKey="likes" fill="hsl(0 85% 50%)" radius={[0, 4, 4, 0]} name={language === "he" ? "לייקים" : "Likes"} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Per-video stats table */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <h3 className="text-sm font-semibold text-foreground px-4 pt-4 pb-2">
                {language === "he" ? "כל הסרטונים" : "All Videos"}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-start px-4 py-2 font-medium">{language === "he" ? "כותרת" : "Title"}</th>
                      <th className="px-3 py-2 font-medium text-center"><Eye className="h-3 w-3 mx-auto" /></th>
                      <th className="px-3 py-2 font-medium text-center"><Heart className="h-3 w-3 mx-auto" /></th>
                      <th className="px-3 py-2 font-medium text-center"><MessageCircle className="h-3 w-3 mx-auto" /></th>
                      <th className="px-3 py-2 font-medium text-center"><Share2 className="h-3 w-3 mx-auto" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...videos].sort((a, b) => b.views_count - a.views_count).map((v) => (
                      <tr key={v.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-2.5 text-foreground truncate max-w-[120px]">{v.title}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{formatNum(v.views_count)}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{formatNum(v.likes_count)}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{formatNum(v.comments_count)}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{formatNum(v.shares_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </DesktopLayout>
  );
};

export default Analytics;
