import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Grid3X3,
  Lock,
  MoreHorizontal,
  Play,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFollow } from "@/hooks/useFollow";
import BottomNav from "@/components/BottomNav";

type TabKey = "videos" | "private" | "saved" | "about";

const TABS: { key: TabKey; icon: typeof Grid3X3 }[] = [
  { key: "videos", icon: Grid3X3 },
  { key: "private", icon: Lock },
  { key: "saved", icon: Bookmark },
  { key: "about", icon: User },
];

const formatCount = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
};

const PlayerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("videos");
  const [scrolled, setScrolled] = useState(false);
  const { isFollowing, toggleFollow, loading: followLoading } = useFollow(userId);

  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    videos: null,
    private: null,
    saved: null,
  });
  const tabBarRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: p }, { data: v }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("videos").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);
      setProfile(p);
      setVideos(v || []);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  // Record anonymous coach/scout views (server-side guard)
  useEffect(() => {
    if (!user || !userId) return;
    if (user.id === userId) return;
    (supabase as any)
      .rpc("record_profile_view", { p_viewed_user_id: userId })
      .then(() => {})
      .catch(() => {});
  }, [user, userId]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalLikes = useMemo(() => videos.reduce((sum, v) => sum + (v.likes_count || 0), 0), [videos]);

  const underlineStyle = useMemo(() => {
    const el = tabRefs.current[activeTab];
    const bar = tabBarRef.current;
    if (!el || !bar) return { left: 0, width: 0 };
    const barRect = bar.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return { left: elRect.left - barRect.left, width: elRect.width };
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-glow rounded-full gradient-fire p-6">
          <span className="font-display text-2xl text-primary-foreground">🏀</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground font-semibold">{t("profile.playerNotFound")}</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm">
          {t("profile.goBack")}
        </button>
        <BottomNav />
      </div>
    );
  }

  const displayName = profile.display_name || "Player";
  const handle = `@${displayName.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-card" : "bg-transparent"
        }`}
      >
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
        </button>
        <h1
          className={`font-display text-lg text-foreground tracking-wide transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        >
          {displayName}
        </h1>
        <button className="p-1">
          <MoreHorizontal className="h-5 w-5 text-foreground" />
        </button>
      </div>

      <div className="flex flex-col items-center px-4 pt-16 pb-2">
        <div className="relative mb-3">
          <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full gradient-fire flex items-center justify-center">
                <span className="font-display text-4xl text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>

        <h2 className="font-display text-2xl text-foreground tracking-wide">{displayName}</h2>
        <p className="text-sm text-muted-foreground mb-3">{handle}</p>

        <div className="flex gap-0 mb-4">
          {[
            { value: profile.following_count || 0, label: t("profile.following") },
            { value: profile.followers_count || 0, label: t("profile.followers") },
            { value: totalLikes, label: t("profile.likes") },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center px-6">
              <span className="font-display text-xl text-foreground leading-tight">{formatCount(stat.value)}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 w-full max-w-xs mb-4">
          {isOwnProfile ? (
            <button
              onClick={() => navigate("/profile")}
              className="flex-1 rounded-md bg-secondary py-2 text-sm font-semibold text-foreground"
            >
              {t("profile.editProfile")}
            </button>
          ) : (
            <>
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold transition-all ${
                  isFollowing ? "bg-secondary text-foreground" : "gradient-fire text-primary-foreground shadow-glow"
                }`}
              >
                {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isFollowing ? t("video.followingBtn") : t("profile.follow")}
              </button>
              <button className="flex-1 rounded-md bg-secondary py-2 text-sm font-semibold text-foreground">{t("profile.message")}</button>
            </>
          )}
        </div>

        {(profile.bio || profile.position || profile.team) && (
          <div className="w-full max-w-xs text-center space-y-1 mb-2">
            {profile.position && (
              <p className="text-xs font-semibold text-foreground">
                {profile.position}
                {profile.team ? ` · ${profile.team}` : ""}
              </p>
            )}
            {profile.bio && <p className="text-sm text-muted-foreground leading-snug">{profile.bio}</p>}
          </div>
        )}
      </div>

      <div ref={tabBarRef} className="relative flex border-b border-border sticky top-[52px] z-40 bg-background">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => {
              tabRefs.current[tab.key] = el;
            }}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 flex justify-center py-3 transition-colors"
          >
            <tab.icon
              className={`h-5 w-5 transition-colors duration-200 ${activeTab === tab.key ? "text-foreground" : "text-muted-foreground"}`}
            />
          </button>
        ))}
        <div
          className="absolute bottom-0 h-0.5 bg-foreground transition-all duration-300 ease-out"
          style={{ left: underlineStyle.left, width: underlineStyle.width }}
        />
      </div>

      <div className="min-h-[40vh]">
        {activeTab === "videos" &&
          (videos.length > 0 ? (
            <div className="grid grid-cols-3 gap-px">
              {videos.map((video) => (
                <div key={video.id} className="relative aspect-[9/16] overflow-hidden bg-secondary group">
                  {video.media_type === "image" ? (
                    <img src={video.video_url} className="h-full w-full object-cover" alt="" loading="lazy" />
                  ) : (
                    <video src={video.video_url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  )}
                  <div className="absolute bottom-1 start-1 flex items-center gap-0.5 pointer-events-none">
                    <Play className="h-3 w-3 text-primary-foreground" fill="currentColor" />
                    <span className="text-[10px] font-semibold text-primary-foreground drop-shadow-md">
                      {formatCount(video.views_count || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="rounded-full border-2 border-muted-foreground/30 p-5 mb-4">
                <Grid3X3 className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-foreground font-semibold mb-1">{t("profile.noVideos")}</p>
            </div>
          ))}
        {activeTab === "private" && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full border-2 border-muted-foreground/30 p-5 mb-4">
              <Lock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-foreground font-semibold">{t("profile.privateVideos")}</p>
          </div>
        )}
        {activeTab === "saved" && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full border-2 border-muted-foreground/30 p-5 mb-4">
              <Bookmark className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-foreground font-semibold">{t("profile.saved")}</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default PlayerProfile;
