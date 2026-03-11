import { useEffect, useState, useRef, useMemo, forwardRef } from "react";

import {
  Grid3X3,
  Lock,
  Bookmark,
  Settings,
  UserPlus,
  Play,
  User,
  BadgeCheck,
  BarChart2,
  Repeat2,
  Plus,
  Images,
  Heart,
  Share2,
  Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import EditProfileDialog from "@/components/EditProfileDialog";
import { useStories } from "@/hooks/useStories";
import StoryViewer from "@/components/StoryViewer";
import StoryUploadModal from "@/components/StoryUploadModal";
import { AnimatePresence } from "framer-motion";

type TabKey = "liked" | "videos" | "repost" | "private" | "saved" | "about";

const formatCount = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
};

/* ───── Grid cell ───── */
const GridCell = forwardRef<HTMLDivElement, {
  video: any;
  index: number;
  onClick: () => void;
  scoutViews?: number;
}>(({
  video,
  index,
  onClick,
  scoutViews,
}, ref) => {
  const isGallery = video.media_type === "gallery";
  const isImage = video.media_type === "image";

  const thumbSrc = isGallery
    ? video.gallery_urls?.[0] ?? null
    : isImage
    ? video.video_url
    : video.thumbnail_url ?? null;

  return (
    <div
      key={video.id}
      className="relative aspect-[9/16] overflow-hidden bg-secondary group cursor-pointer"
      onClick={onClick}
    >
      {thumbSrc ? (
        <img src={thumbSrc} className="h-full w-full object-cover" alt="" loading="lazy" />
      ) : (
        <div className="h-full w-full bg-secondary flex items-center justify-center">
          <Play className="h-3 w-3 text-white" />
        </div>
      )}

      {/* gallery badge */}
      {isGallery && (
        <div className="absolute top-1.5 end-1.5 pointer-events-none">
          <Images className="h-3.5 w-3.5 text-white drop-shadow-md" />
        </div>
      )}

      {/* pinned badge */}
      {video.is_pinned && (
        <div
          className="absolute top-1.5 end-1.5 pointer-events-none rounded-[3px] px-1.5 py-0.5"
          style={{ background: "#FF4D6A", fontSize: 11, fontWeight: 700 }}
        >
          <span className="text-white">Pinned</span>
        </div>
      )}

      {/* Bottom stats */}
      <div className="absolute bottom-1 start-1 end-1 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-0.5">
          <Play className="h-3 w-3 text-white" fill="currentColor" />
          <span
            className="text-white"
            style={{
              fontSize: 12,
              fontWeight: 600,
              textShadow: "0px 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {formatCount(video.views_count || 0)}
          </span>
        </div>
        {typeof scoutViews === "number" && (
          <div className="flex items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5 backdrop-blur-sm">
            <span style={{ fontSize: 10 }}>🔍</span>
            <span
              className="text-white"
              style={{
                fontSize: 11,
                fontWeight: 700,
                textShadow: "0px 1px 3px rgba(0,0,0,0.8)",
              }}
            >
              {formatCount(scoutViews)}
            </span>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
});
GridCell.displayName = "GridCell";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [repostedVideos, setRepostedVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("videos");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileViews, setProfileViews] = useState<{ coach: number; scout: number } | null>(null);
  const { storyGroups, fetchStories, hasActiveStory } = useStories();
  const [storyViewerGroup, setStoryViewerGroup] = useState<any>(null);
  const [storyUploadOpen, setStoryUploadOpen] = useState(false);
  const [scoutFollowers, setScoutFollowers] = useState(0);
  const [scoutRating, setScoutRating] = useState<number | null>(null);
  const [videoScoutViews, setVideoScoutViews] = useState<Record<string, number>>({});

  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    liked: null,
    videos: null,
    repost: null,
    private: null,
    saved: null,
    about: null,
  });
  const tabBarRef = useRef<HTMLDivElement>(null);

  const TABS: { key: TabKey; icon: typeof Grid3X3; label: string }[] = [
    { key: "liked", icon: Heart, label: "Liked" },
    { key: "videos", icon: Grid3X3, label: "Videos" },
    { key: "repost", icon: Repeat2, label: "Reposts" },
    { key: "private", icon: Lock, label: t("profile.privateVideos") },
    { key: "saved", icon: Bookmark, label: t("profile.saved") },
    { key: "about", icon: User, label: t("profile.aboutMe") },
  ];

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchProfile(),
      fetchVideos(),
      fetchSavedVideos(),
      fetchRepostedVideos(),
      fetchLikedVideos(),
      fetchProfileViewStats(),
      fetchScoutFollowers(),
      fetchScoutRating(),
      fetchVideoScoutViews(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    setProfile(data);
  };

  const fetchVideos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setVideos(data || []);
  };

  const fetchSavedVideos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookmarks")
      .select("video_id, videos(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSavedVideos((data || []).map((b: any) => b.videos).filter(Boolean));
  };

  const fetchRepostedVideos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reposts")
      .select("video_id, videos(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRepostedVideos((data || []).map((r: any) => r.videos).filter(Boolean));
  };

  const fetchLikedVideos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("video_likes")
      .select("video_id, videos(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLikedVideos((data || []).map((l: any) => l.videos).filter(Boolean));
  };

  const fetchProfileViewStats = async () => {
    if (!user) return;
    try {
      const { data } = await (supabase as any).rpc("get_profile_view_stats", { p_user_id: user.id });
      const rows = (data || []) as Array<{ viewer_type: string; views: number }>;
      const coach = rows.find((r) => r.viewer_type === "coach")?.views ?? 0;
      const scout = rows.find((r) => r.viewer_type === "scout")?.views ?? 0;
      setProfileViews({ coach, scout });
    } catch {
      setProfileViews(null);
    }
  };

  const fetchScoutFollowers = async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", user.id)
        .in("follower_id",
          (await supabase.from("user_types").select("user_id").eq("type", "scout")).data?.map((r: any) => r.user_id) || []
        );
      setScoutFollowers(count || 0);
    } catch {
      setScoutFollowers(0);
    }
  };

  const fetchScoutRating = async () => {
    if (!user) return;
    try {
      const { data } = await (supabase as any)
        .from("scout_ratings")
        .select("rating")
        .eq("player_id", user.id);
      if (data && data.length > 0) {
        const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
        setScoutRating(Math.round(avg * 10) / 10);
      } else {
        setScoutRating(null);
      }
    } catch {
      setScoutRating(null);
    }
  };

  const fetchVideoScoutViews = async () => {
    if (!user) return;
    try {
      const { data: scoutTypes } = await supabase.from("user_types").select("user_id").eq("type", "scout");
      const scoutIds = (scoutTypes || []).map((r: any) => r.user_id);
      if (scoutIds.length === 0) { setVideoScoutViews({}); return; }
      const { data: views } = await (supabase as any)
        .from("video_views")
        .select("video_id")
        .in("viewer_id", scoutIds);
      const counts: Record<string, number> = {};
      (views || []).forEach((v: any) => {
        counts[v.video_id] = (counts[v.video_id] || 0) + 1;
      });
      setVideoScoutViews(counts);
    } catch {
      setVideoScoutViews({});
    }
  };

  const totalLikes = useMemo(() => videos.reduce((sum, v) => sum + (v.likes_count || 0), 0), [videos]);
  const totalShares = useMemo(() => videos.reduce((sum, v) => sum + (v.shares_count || 0), 0), [videos]);
  const totalReposts = useMemo(() => videos.reduce((sum, v) => sum + (v.reposts_count || 0), 0), [videos]);

  const underlineStyle = useMemo(() => {
    const el = tabRefs.current[activeTab];
    const bar = tabBarRef.current;
    if (!el || !bar) return { left: 0, width: 0 };
    const barRect = bar.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // Center underline on icon only (22px)
    const iconW = 22;
    const center = elRect.left + elRect.width / 2 - barRect.left;
    return { left: center - iconW / 2, width: iconW };
  }, [activeTab]);

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
        <p className="font-display text-2xl text-foreground mb-4">{t("auth.signInToView")}</p>
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

  const displayName = profile?.display_name || "Player";
  const handle = `@${(profile?.display_name || "player").toLowerCase().replace(/\s+/g, "")}`;

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-4">
      <div className="mx-auto max-w-[480px]">
        {/* ── Header ── */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${
            scrolled ? "bg-black/95 backdrop-blur-lg border-b border-white/10 shadow-card" : "bg-transparent"
          }`}
        >
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-1">
              <Share2 className="h-5 w-5 text-white" />
            </button>
            <button onClick={() => navigate("/discover")} className="p-1">
              <UserPlus className="h-5 w-5 text-white" />
            </button>
          </div>
          <h1
            className={`text-lg text-white tracking-normal transition-opacity duration-300 ${
              scrolled ? "opacity-100" : "opacity-0"
            }`}
            style={{ fontSize: 18, fontWeight: 700 }}
          >
            {displayName}
          </h1>
          <button onClick={() => navigate("/settings")} className="p-1">
            <Settings className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* ── Avatar + Info ── */}
        <div className="flex flex-col items-center px-4" style={{ paddingTop: 68 }}>
          {/* ONFLICK branding above avatar */}
          <button
            onClick={() => navigate("/onflick")}
            className="mb-2 tracking-[0.15em]"
            style={{ marginTop: 12 }}
          >
            <span className="text-[#FE2C55] font-bold text-sm opacity-80 hover:opacity-100 transition-opacity" style={{ letterSpacing: "0.2em" }}>
              ONFLICK
            </span>
          </button>

          {/* Avatar with story ring — responsive sizing */}
          <div className="relative" style={{ marginBottom: 12 }}>
            {(() => {
              const myStoryGroup = storyGroups.find((g) => g.userId === user?.id);
              const hasStory = !!myStoryGroup;
              const avatarContent = (
                <div className="h-24 w-24 md:h-28 md:w-28 lg:h-[120px] lg:w-[120px] rounded-full overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full gradient-fire flex items-center justify-center">
                      <span className="font-display text-5xl text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              );
              return hasStory ? (
                <button
                  onClick={() => setStoryViewerGroup(myStoryGroup)}
                  className="rounded-full p-[3px] bg-gradient-to-tr from-blue-500 to-purple-500"
                >
                  <div className="rounded-full p-[2px] bg-black">
                    {avatarContent}
                  </div>
                </button>
              ) : (
                <div className="ring-2 ring-white/20 ring-offset-2 ring-offset-black rounded-full">
                  {avatarContent}
                </div>
              );
            })()}
            {/* Add story button — bigger */}
            <button
              onClick={() => {
                const myStoryGroup = storyGroups.find((g) => g.userId === user?.id);
                if (myStoryGroup) {
                  setStoryViewerGroup(myStoryGroup);
                } else {
                  setStoryUploadOpen(true);
                }
              }}
              className="absolute flex items-center justify-center rounded-full"
              style={{
                bottom: -5,
                left: "50%",
                transform: "translateX(-50%)",
                width: 30,
                height: 30,
                background: "#20D5EC",
                border: "2.5px solid black",
                zIndex: 10,
              }}
              aria-label="Add story"
            >
              <Plus className="text-white" style={{ width: 16, height: 16 }} strokeWidth={3} />
            </button>
          </div>

          {/* Name */}
          <div className="flex items-center gap-1.5" style={{ marginTop: 12 }}>
            <h2
              className="text-white"
              style={{ fontSize: 18, fontWeight: 700, letterSpacing: "normal" }}
            >
              {displayName}
            </h2>
            {profile?.verified && <BadgeCheck className="h-5 w-5 text-primary" fill="currentColor" />}
          </div>

          {/* Handle */}
          <p style={{ fontSize: 14, marginTop: 2 }} className="text-white/60">
            {handle}
          </p>

          {/* Stats — Row 1: TikTok style */}
          <div className="flex items-center justify-center" style={{ marginTop: 16, gap: 0 }}>
            {[
              { value: profile?.following_count || 0, label: t("profile.following"), onClick: () => user && navigate(`/user/${user.id}/follows?tab=following`) },
              { value: profile?.followers_count || 0, label: t("profile.followers"), onClick: () => user && navigate(`/user/${user.id}/follows?tab=followers`) },
              { value: totalLikes, label: t("profile.likes") },
              { value: totalShares, label: t("profile.shares") },
              { value: totalReposts, label: t("profile.reposts") },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center">
                {i > 0 && (
                  <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)", margin: "0 16px" }} />
                )}
                <div
                  className={`flex flex-col items-center ${stat.onClick ? "cursor-pointer active:opacity-70" : ""}`}
                  style={{ minWidth: 48 }}
                  onClick={stat.onClick}
                >
                  <span className="text-white" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                    {formatCount(stat.value)}
                  </span>
                  <span className="text-white/60" style={{ fontSize: 11 }}>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats — Row 2: Scout metrics */}
          <div className="flex items-center justify-center" style={{ marginTop: 10, marginBottom: 16, gap: 0 }}>
            {/* Scout views */}
            <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
              <span className="text-white" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                {formatCount(profileViews?.scout ?? 0)}
              </span>
              <span className="text-white/60" style={{ fontSize: 11 }}>🔍 {t("profile.scoutViews")}</span>
            </div>

            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)", margin: "0 16px" }} />

            {/* Scout followers */}
            <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
              <span className="text-white" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                {formatCount(scoutFollowers)}
              </span>
              <span className="text-white/60" style={{ fontSize: 11 }}>🎯 {language === "he" ? "סקאוטים עוקבים" : "Scout Followers"}</span>
            </div>

            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)", margin: "0 16px" }} />

            {/* Scout rank */}
            <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
              <span className="text-white" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                {scoutRating ? `${scoutRating}/5` : "—"}
              </span>
              <span className="text-white/60" style={{ fontSize: 11 }}>⭐ SCOUT RANK</span>
            </div>
          </div>




          {/* Action buttons */}
          <div className="flex w-full max-w-xs" style={{ gap: 8, marginBottom: 12, marginTop: 0 }}>
            <button
              onClick={() => setEditOpen(true)}
              data-edit-profile
              className="flex-1 flex items-center justify-center text-white"
              style={{
                height: 36,
                borderRadius: 6,
                background: "#2A2A2A",
                fontSize: 14,
                fontWeight: 600,
                gap: 6,
              }}
            >
              <Pencil className="text-white" style={{ width: 14, height: 14 }} />
              {t("profile.editProfile")}
            </button>
            <button
              className="flex-1 flex items-center justify-center text-white"
              style={{
                height: 36,
                borderRadius: 6,
                background: "#2A2A2A",
                fontSize: 14,
                fontWeight: 600,
              }}
              onClick={async () => {
                const profileUrl = `${window.location.origin}/player/${user?.id}`;
                try {
                  if (typeof navigator.share === "function") {
                    await navigator.share({
                      title: profile?.display_name || "ONFLICK Profile",
                      text: `${profile?.display_name || "Check out this profile"} on ONFLICK`,
                      url: profileUrl,
                    });
                    return;
                  }
                } catch {
                  // share dialog cancelled or failed — fall through to copy
                }
                try {
                  await navigator.clipboard.writeText(profileUrl);
                  toast({ title: "✅ הלינק הועתק!" });
                } catch {
                  const ta = document.createElement("textarea");
                  ta.value = profileUrl;
                  ta.style.position = "fixed";
                  ta.style.opacity = "0";
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand("copy");
                  document.body.removeChild(ta);
                  toast({ title: "✅ הלינק הועתק!" });
                }
              }}
            >
              {t("profile.shareProfile")}
            </button>
            <button
              onClick={() => navigate("/analytics")}
              className="flex items-center justify-center text-white"
              style={{
                width: 40,
                height: 36,
                borderRadius: 6,
                background: "#2A2A2A",
              }}
              title="Analytics"
            >
              <BarChart2 className="text-white" style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Bio / position */}
          {(profile?.bio || profile?.position || profile?.team) && (
            <div className="w-full max-w-xs text-center space-y-1" style={{ marginTop: 8, marginBottom: 12 }}>
              {profile?.position && (
                <p className="text-white" style={{ fontSize: 13, fontWeight: 600 }}>
                  {profile.position}
                  {profile.team ? ` · ${profile.team}` : ""}
                </p>
              )}
              {profile?.bio && (
                <p style={{ fontSize: 14, lineHeight: 1.4, color: "rgba(255,255,255,0.9)" }}>
                  {bioExpanded || profile.bio.length <= 80 ? profile.bio : `${profile.bio.slice(0, 80)}...`}
                  {profile.bio.length > 80 && (
                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="ms-1"
                      style={{ fontWeight: 600, color: "white" }}
                    >
                      {bioExpanded ? t("profile.bioLess") : t("profile.bioMore")}
                    </button>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div
          ref={tabBarRef}
          className="relative flex sticky top-[52px] z-40"
          style={{
            background: "black",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            marginTop: 16,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[tab.key] = el;
                }}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex justify-center transition-colors"
                style={{ paddingTop: 10, paddingBottom: 10 }}
                aria-label={tab.label}
              >
                <tab.icon
                  style={{
                    width: 22,
                    height: 22,
                    color: "white",
                    opacity: isActive ? 1 : 0.45,
                    transition: "opacity 0.2s",
                  }}
                />
              </button>
            );
          })}
          <div
            className="absolute bottom-0 bg-white transition-all duration-300 ease-out"
            style={{ left: underlineStyle.left, width: underlineStyle.width, height: 2 }}
          />
        </div>

        {/* ── Tab content ── */}
        <div className="min-h-[40vh]">
          {activeTab === "liked" && (
            <>
              {likedVideos.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={{ gap: 1.5 }}>
                  {likedVideos.map((video, index) => (
                    <GridCell
                      key={video.id}
                      video={video}
                      index={index}
                      onClick={() => navigate(`/profile/feed?start=${index}`, { state: { videos: likedVideos } })}
                    />
                  ))}
                </div>
              ) : (
                <EmptyTabState icon={Heart} title="Liked" subtitle="No liked videos yet" />
              )}
            </>
          )}

          {activeTab === "videos" && (
            <>
              {videos.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={{ gap: 1.5 }}>
                  {videos.map((video, index) => (
                    <GridCell
                      key={video.id}
                      video={video}
                      index={index}
                      scoutViews={videoScoutViews[video.id] ?? 0}
                      onClick={() => navigate(`/profile/feed?start=${index}`, { state: { videos } })}
                    />
                  ))}
                </div>
              ) : (
                <EmptyTabState icon={Grid3X3} title={t("profile.noVideos")} subtitle={t("profile.uploadFirst")} />
              )}
            </>
          )}

          {activeTab === "repost" && (
            <>
              {repostedVideos.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={{ gap: 1.5 }}>
                  {repostedVideos.map((video, index) => (
                    <GridCell
                      key={video.id}
                      video={video}
                      index={index}
                      onClick={() => navigate(`/profile/feed?start=${index}`, { state: { videos: repostedVideos } })}
                    />
                  ))}
                </div>
              ) : (
                <EmptyTabState icon={Repeat2} title="Reposts" subtitle="No reposts yet" />
              )}
            </>
          )}

          {activeTab === "private" && (
            <EmptyTabState icon={Lock} title={t("profile.privateVideos")} subtitle={t("profile.onlyYou")} />
          )}

          {activeTab === "saved" && (
            <>
              {savedVideos.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={{ gap: 1.5 }}>
                  {savedVideos.map((video, index) => (
                    <GridCell
                      key={video.id}
                      video={video}
                      index={index}
                      onClick={() => navigate(`/profile/feed?start=${index}`, { state: { videos: savedVideos } })}
                    />
                  ))}
                </div>
              ) : (
                <EmptyTabState icon={Bookmark} title={t("profile.saved")} subtitle={t("profile.saveHighlights")} />
              )}
            </>
          )}

          {activeTab === "about" && profile && <AboutMeSection profile={profile} />}
        </div>

        <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} profile={profile || {}} onSaved={fetchProfile} />
      </div>
      <BottomNav />

      {/* Story viewer */}
      <AnimatePresence>
        {storyViewerGroup && (
          <StoryViewer
            group={storyViewerGroup}
            onClose={() => { setStoryViewerGroup(null); fetchStories(); }}
          />
        )}
      </AnimatePresence>

      {/* Story upload */}
      <StoryUploadModal
        open={storyUploadOpen}
        onClose={() => setStoryUploadOpen(false)}
        onUploaded={fetchStories}
      />
    </div>
  );
};

const EmptyTabState = forwardRef<
  HTMLDivElement,
  { icon: typeof Grid3X3; title: string; subtitle: string }
>(({ icon: Icon, title, subtitle }, ref) => (
  <div ref={ref} className="flex flex-col items-center justify-center py-20 px-8">
    <div className="rounded-full border-2 border-white/20 p-5 mb-4">
      <Icon className="h-8 w-8 text-white/40" />
    </div>
    <p className="text-white font-semibold mb-1">{title}</p>
    <p className="text-sm text-white/50 text-center">{subtitle}</p>
  </div>
));
EmptyTabState.displayName = "EmptyTabState";

const AboutMeSection = ({ profile }: { profile: any }) => {
  const { t } = useLanguage();

  const sections = [
    {
      title: t("editProfile.personal"),
      items: [
        { label: t("editProfile.dob"), value: profile.dob ? new Date(profile.dob).toLocaleDateString() : null },
        { label: t("editProfile.graduationYear"), value: profile.graduation_year },
        { label: t("editProfile.primaryPosition"), value: profile.position },
        { label: t("editProfile.secondaryPosition"), value: profile.secondary_position },
        { label: t("editProfile.dominantHand"), value: profile.dominant_hand },
        { label: t("editProfile.currentTeam"), value: profile.team },
        { label: t("editProfile.league"), value: profile.league },
      ],
    },
    {
      title: t("editProfile.physical"),
      items: [
        { label: t("editProfile.height"), value: profile.height_cm ? `${profile.height_cm} cm` : null },
        { label: t("editProfile.weight"), value: profile.weight_kg ? `${profile.weight_kg} kg` : null },
        { label: t("editProfile.wingspan"), value: profile.wingspan_cm ? `${profile.wingspan_cm} cm` : null },
        { label: t("editProfile.verticalLeap"), value: profile.vertical_leap_cm ? `${profile.vertical_leap_cm} cm` : null },
        { label: t("editProfile.sprint"), value: profile.sprint_20m_sec ? `${profile.sprint_20m_sec} sec` : null },
      ],
    },
    {
      title: t("editProfile.stats"),
      items: [
        { label: t("editProfile.ppg"), value: profile.ppg },
        { label: t("editProfile.rpg"), value: profile.rpg },
        { label: t("editProfile.apg"), value: profile.apg },
        { label: t("editProfile.threePt"), value: profile.three_pt_pct ? `${profile.three_pt_pct}%` : null },
        { label: t("editProfile.ft"), value: profile.ft_pct ? `${profile.ft_pct}%` : null },
      ],
    },
    {
      title: t("editProfile.about"),
      items: [
        { label: t("editProfile.topTraits"), value: profile.top_traits },
        { label: t("editProfile.highlightsLink"), value: profile.highlights_link, isLink: true },
        { label: t("editProfile.gpa"), value: profile.gpa },
        { label: t("editProfile.comparisonPlayer"), value: profile.comparison_player },
        { label: t("editProfile.bioCoach"), value: profile.bio, isLong: true },
      ],
    },
  ];

  const hasAnyData = sections.some((section) => section.items.some((item) => item.value));

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <div className="rounded-full border-2 border-white/20 p-5 mb-4">
          <User className="h-8 w-8 text-white/40" />
        </div>
        <p className="text-white font-semibold mb-1">{t("profile.noDataYet")}</p>
        <p className="text-sm text-white/50 text-center">{t("profile.fillProfile")}</p>
        <button
          onClick={() => document.querySelector<HTMLButtonElement>("[data-edit-profile]")?.click()}
          className="mt-4 rounded-xl gradient-fire px-6 py-2 text-sm font-bold text-white shadow-glow"
        >
          {t("profile.editProfile")}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {sections.map((section) => {
        const sectionItems = section.items.filter((item) => item.value);
        if (sectionItems.length === 0) return null;

        return (
          <div key={section.title} className="space-y-3">
            <h3 className="text-lg text-white tracking-wide border-b border-white/10 pb-2" style={{ fontWeight: 700 }}>
              {section.title}
            </h3>
            <div className="grid gap-3">
              {sectionItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 p-3 space-y-1" style={{ background: "#1A1A1A" }}>
                  <p className="text-xs text-white/50 uppercase tracking-wide">{item.label}</p>
                  {item.isLink && item.value ? (
                    <a
                      href={item.value.toString()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className={`text-white ${item.isLong ? "text-sm leading-relaxed" : "font-semibold"}`}>
                      {item.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Profile;
