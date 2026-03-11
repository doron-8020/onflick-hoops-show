import { useEffect, useMemo, useRef, useState } from "react";
import VideoFrameThumb from "@/components/VideoFrameThumb";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Grid3X3,
  Info,
  Lock,
  MoreHorizontal,
  Play,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFollow } from "@/hooks/useFollow";
import { useStartConversation } from "@/hooks/useStartConversation";
import BottomNav from "@/components/BottomNav";
import { useStories } from "@/hooks/useStories";
import StoryViewer from "@/components/StoryViewer";
import { AnimatePresence } from "framer-motion";

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
  const [bioExpanded, setBioExpanded] = useState(false);
  const { isFollowing, toggleFollow, loading: followLoading } = useFollow(userId);
  const startConversation = useStartConversation();
  const { storyGroups, fetchStories } = useStories();
  const [storyViewerGroup, setStoryViewerGroup] = useState<any>(null);

  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    videos: null,
    private: null,
    saved: null,
    about: null,
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
      <div className="min-h-screen bg-background pb-24 md:pb-4">
      <div className="mx-auto max-w-[480px]">
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
          {(() => {
            const playerStoryGroup = storyGroups.find((g) => g.userId === userId);
            const hasStory = !!playerStoryGroup;
            const avatarEl = (
              <div className="h-24 w-24 md:h-28 md:w-28 lg:h-[120px] lg:w-[120px] rounded-full overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-fire flex items-center justify-center">
                    <span className="font-display text-4xl text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            );
            return hasStory ? (
              <button
                onClick={() => setStoryViewerGroup(playerStoryGroup)}
                className="rounded-full p-[3px] bg-gradient-to-tr from-blue-500 to-purple-500"
              >
                <div className="rounded-full p-[2px] bg-background">
                  {avatarEl}
                </div>
              </button>
            ) : (
              <div className="ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-full">
                {avatarEl}
              </div>
            );
          })()}
        </div>

        <div className="flex items-center gap-1.5 justify-center">
          <h2 className="font-display text-2xl md:text-[20px] lg:text-[22px] text-foreground tracking-wide">{displayName}</h2>
          {profile.verified && <BadgeCheck className="h-5 w-5 text-primary" fill="currentColor" />}
        </div>
        <p className="text-[13px] md:text-[15px] lg:text-[16px] text-muted-foreground mb-3">{handle}</p>

        <div className="flex gap-0 mb-4">
          {[
            { value: profile.following_count || 0, label: t("profile.following"), onClick: () => navigate(`/user/${userId}/follows?tab=following`) },
            { value: profile.followers_count || 0, label: t("profile.followers"), onClick: () => navigate(`/user/${userId}/follows?tab=followers`) },
            { value: totalLikes, label: t("profile.likes") },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center px-6 ${stat.onClick ? "cursor-pointer active:opacity-70" : ""}`}
              onClick={stat.onClick}
            >
              <span className="font-display text-lg md:text-xl lg:text-[22px] text-foreground leading-tight">{formatCount(stat.value)}</span>
              <span className="text-xs md:text-[13px] text-muted-foreground">{stat.label}</span>
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
                onClick={() => setActiveTab("about")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive/90 py-2 text-sm font-bold text-destructive-foreground shadow-lg"
              >
                <Info className="h-4 w-4" />
                {t("profile.aboutMeBtn")}
              </button>
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
              <button onClick={() => userId && startConversation(userId)} className="flex-1 rounded-md bg-secondary py-2 text-sm font-semibold text-foreground">{t("profile.message")}</button>
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
            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-snug">
                {bioExpanded || profile.bio.length <= 80 ? profile.bio : `${profile.bio.slice(0, 80)}...`}
                {profile.bio.length > 80 && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="text-foreground font-semibold ms-1"
                  >
                    {bioExpanded ? t("profile.bioLess") : t("profile.bioMore")}
                  </button>
                )}
              </p>
            )}
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
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px">
              {videos.map((video, index) => {
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
                  onClick={() => navigate(`/profile/feed?start=${index}`, { state: { videos } })}
                >
                  {thumbSrc ? (
                    <img src={thumbSrc} className="h-full w-full object-cover" alt="" loading="lazy" />
                  ) : video.video_url ? (
                    <VideoFrameThumb videoUrl={video.video_url} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-secondary flex items-center justify-center">
                      <Play className="h-3 w-3 text-foreground" />
                    </div>
                  )}
                  <div className="absolute bottom-1 start-1 flex items-center gap-0.5 pointer-events-none">
                    <Play className="h-3 w-3 text-primary-foreground" fill="currentColor" />
                    <span className="text-[10px] font-semibold text-primary-foreground drop-shadow-md">
                      {formatCount(video.views_count || 0)}
                    </span>
                  </div>
                </div>
                );
              })}
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
        {activeTab === "about" && profile && <PlayerAboutSection profile={profile} />}
      </div>

      {/* Story viewer overlay */}
      <AnimatePresence>
        {storyViewerGroup && (
          <StoryViewer
            group={storyViewerGroup}
            onClose={() => { setStoryViewerGroup(null); fetchStories(); }}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
    </div>
  );
};

const PlayerAboutSection = ({ profile }: { profile: any }) => {
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
    {
      title: t("editProfile.socialMedia"),
      items: [
        { label: t("editProfile.instagram"), value: profile.social_instagram, isLink: true, linkPrefix: "https://instagram.com/" },
        { label: t("editProfile.tiktok"), value: profile.social_tiktok, isLink: true, linkPrefix: "https://tiktok.com/@" },
        { label: t("editProfile.facebook"), value: profile.social_facebook, isLink: true, linkPrefix: "https://facebook.com/" },
        { label: t("editProfile.youtube"), value: profile.social_youtube, isLink: true, linkPrefix: "https://youtube.com/@" },
      ],
    },
  ];

  const hasAnyData = sections.some((s) => s.items.some((i) => i.value));

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <div className="rounded-full border-2 border-muted-foreground/30 p-5 mb-4">
          <User className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-foreground font-semibold mb-1">{t("profile.noDataYet")}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {sections.map((section) => {
        const items = section.items.filter((i) => i.value);
        if (items.length === 0) return null;
        return (
          <div key={section.title} className="space-y-3">
            <h3 className="font-display text-lg text-foreground tracking-wide border-b border-border pb-2">
              {section.title}
            </h3>
            <div className="grid gap-3">
                  {items.map((item: any) => (
                <div key={item.label} className="bg-card rounded-lg border border-border p-3 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
                  {item.isLink && item.value ? (
                    <a
                      href={item.linkPrefix ? `${item.linkPrefix}${String(item.value).replace('@', '')}` : String(item.value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className={`text-foreground ${item.isLong ? "text-sm leading-relaxed" : "font-semibold"}`}>{item.value}</p>
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

export default PlayerProfile;
