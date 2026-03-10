import { useEffect, useState, useRef, useMemo, forwardRef } from "react";
import {
  Grid3X3,
  Lock,
  Bookmark,
  Settings,
  UserPlus,
  Play,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import EditProfileDialog from "@/components/EditProfileDialog";

type TabKey = "videos" | "private" | "saved" | "about";

const formatCount = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
};

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("videos");
  const [scrolled, setScrolled] = useState(false);
  const [profileViews, setProfileViews] = useState<{ coach: number; scout: number } | null>(null);

  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    videos: null,
    private: null,
    saved: null,
    about: null,
  });
  const tabBarRef = useRef<HTMLDivElement>(null);

  const TABS: { key: TabKey; icon: typeof Grid3X3; label: string }[] = [
    { key: "videos", icon: Grid3X3, label: "Videos" },
    { key: "private", icon: Lock, label: t("profile.privateVideos") },
    { key: "saved", icon: Bookmark, label: t("profile.saved") },
    { key: "about", icon: User, label: t("profile.aboutMe") },
  ];

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchVideos();
    fetchProfileViewStats();
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

  const totalLikes = useMemo(() => videos.reduce((sum, v) => sum + (v.likes_count || 0), 0), [videos]);

  const underlineStyle = useMemo(() => {
    const el = tabRefs.current[activeTab];
    const bar = tabBarRef.current;
    if (!el || !bar) return { left: 0, width: 0 };
    const barRect = bar.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return { left: elRect.left - barRect.left, width: elRect.width };
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
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg">
        <div
          className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${
            scrolled ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-card" : "bg-transparent"
          }`}
        >
          <button onClick={() => navigate("/discover")} className="p-1">
            <UserPlus className="h-5 w-5 text-foreground" />
          </button>
          <h1
            className={`font-display text-lg text-foreground tracking-wide transition-opacity duration-300 ${
              scrolled ? "opacity-100" : "opacity-0"
            }`}
          >
            {displayName}
          </h1>
          <button onClick={() => navigate("/settings")} className="p-1">
            <Settings className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex flex-col items-center px-4 pt-16 pb-2">
          <div className="relative mb-3">
            <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-fire flex items-center justify-center">
                  <span className="font-display text-4xl text-primary-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <h2 className="font-display text-2xl text-foreground tracking-wide">{displayName}</h2>
          <p className="text-sm text-muted-foreground mb-2">{handle}</p>

          {profileViews && (profileViews.coach > 0 || profileViews.scout > 0) && (
            <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {t("profile.coachViews")}: <span className="text-foreground font-semibold">{formatCount(profileViews.coach)}</span>
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span>
                {t("profile.scoutViews")}: <span className="text-foreground font-semibold">{formatCount(profileViews.scout)}</span>
              </span>
            </div>
          )}

          <div className="flex gap-0 mb-4">
            {[
              { value: profile?.following_count || 0, label: t("profile.following") },
              { value: profile?.followers_count || 0, label: t("profile.followers") },
              { value: totalLikes, label: t("profile.likes") },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center px-6">
                <span className="font-display text-xl text-foreground leading-tight">{formatCount(stat.value)}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 w-full max-w-xs mb-4">
            <button
              onClick={() => setEditOpen(true)}
              data-edit-profile
              className="flex-1 rounded-md bg-secondary py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80"
            >
              {t("profile.editProfile")}
            </button>
            <button className="flex-1 rounded-md bg-secondary py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80">
              {t("profile.shareProfile")}
            </button>
            <button className="rounded-md bg-secondary px-3 py-2 transition-colors hover:bg-secondary/80">
              <UserPlus className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {(profile?.bio || profile?.position || profile?.team) && (
            <div className="w-full max-w-xs text-center space-y-1 mb-2">
              {profile?.position && (
                <p className="text-xs font-semibold text-foreground">
                  {profile.position}
                  {profile.team ? ` · ${profile.team}` : ""}
                </p>
              )}
              {profile?.bio && <p className="text-sm text-muted-foreground leading-snug">{profile.bio}</p>}
            </div>
          )}
        </div>

        <div ref={tabBarRef} className="relative flex border-b border-border sticky top-[52px] z-40 bg-background">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[tab.key] = el;
                }}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex justify-center py-3 transition-colors"
                aria-label={tab.label}
              >
                <tab.icon
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                />
              </button>
            );
          })}
          <div
            className="absolute bottom-0 h-0.5 bg-foreground transition-all duration-300 ease-out"
            style={{ left: underlineStyle.left, width: underlineStyle.width }}
          />
        </div>

        <div className="min-h-[40vh]">
          {activeTab === "videos" && (
            <>
              {videos.length > 0 ? (
                <div className="grid grid-cols-3 gap-px">
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="relative aspect-[9/16] overflow-hidden bg-secondary group cursor-pointer"
                      onClick={() => navigate(`/profile/feed?start=${index}`, { state: { videos } })}
                    >
                      {video.media_type === "image" ? (
                        <img src={video.video_url} className="h-full w-full object-cover" alt="" loading="lazy" />
                      ) : (
                        <video
                          src={video.video_url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      )}
                      <div className="absolute bottom-1 start-1 flex items-center gap-0.5 pointer-events-none">
                        <Play className="h-3 w-3 text-primary-foreground" fill="currentColor" />
                        <span className="text-[10px] font-semibold text-primary-foreground drop-shadow-md">
                          {formatCount(video.views_count || 0)}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-background/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyTabState icon={Grid3X3} title={t("profile.noVideos")} subtitle={t("profile.uploadFirst")} />
              )}
            </>
          )}
          {activeTab === "private" && (
            <EmptyTabState icon={Lock} title={t("profile.privateVideos")} subtitle={t("profile.onlyYou")} />
          )}
          {activeTab === "saved" && (
            <EmptyTabState icon={Bookmark} title={t("profile.saved")} subtitle={t("profile.saveHighlights")} />
          )}
          {activeTab === "about" && profile && <AboutMeSection profile={profile} />}
        </div>

        <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} profile={profile || {}} onSaved={fetchProfile} />
      </div>
      <BottomNav />
    </div>
  );
};

const EmptyTabState = forwardRef<
  HTMLDivElement,
  { icon: typeof Grid3X3; title: string; subtitle: string }
>(({ icon: Icon, title, subtitle }, ref) => (
  <div ref={ref} className="flex flex-col items-center justify-center py-20 px-8">
    <div className="rounded-full border-2 border-muted-foreground/30 p-5 mb-4">
      <Icon className="h-8 w-8 text-muted-foreground/50" />
    </div>
    <p className="text-foreground font-semibold mb-1">{title}</p>
    <p className="text-sm text-muted-foreground text-center">{subtitle}</p>
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
        <div className="rounded-full border-2 border-muted-foreground/30 p-5 mb-4">
          <User className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-foreground font-semibold mb-1">{t("profile.noDataYet")}</p>
        <p className="text-sm text-muted-foreground text-center">{t("profile.fillProfile")}</p>
        <button
          onClick={() => document.querySelector<HTMLButtonElement>("[data-edit-profile]")?.click()}
          className="mt-4 rounded-xl gradient-fire px-6 py-2 text-sm font-bold text-primary-foreground shadow-glow"
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
            <h3 className="font-display text-lg text-foreground tracking-wide border-b border-border pb-2">
              {section.title}
            </h3>
            <div className="grid gap-3">
              {sectionItems.map((item) => (
                <div key={item.label} className="bg-card rounded-lg border border-border p-3 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
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
                    <p className={`text-foreground ${item.isLong ? "text-sm leading-relaxed" : "font-semibold"}`}>
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
