import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Sun, Moon, Globe, LogOut, Shield, User, Mail, Trash2,
  Lock, MessageCircle, Bell, BellOff, Wifi, Play, FileText, HardDrive,
  ChevronRight, AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import EditProfileDialog from "@/components/EditProfileDialog";
import ChangeEmailDialog from "@/components/ChangeEmailDialog";

interface UserSettings {
  private_profile: boolean;
  comment_privacy: string;
  notify_followers: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_messages: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [signingOut, setSigningOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettings>({
    private_profile: false,
    comment_privacy: "everyone",
    notify_followers: true,
    notify_likes: true,
    notify_comments: true,
    notify_messages: true,
  });
  const [dataSaver, setDataSaver] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (data) {
      setProfile(data);
      setSettings({
        private_profile: (data as any).private_profile ?? false,
        comment_privacy: (data as any).comment_privacy ?? "everyone",
        notify_followers: (data as any).notify_followers ?? true,
        notify_likes: (data as any).notify_likes ?? true,
        notify_comments: (data as any).notify_comments ?? true,
        notify_messages: (data as any).notify_messages ?? true,
      });
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (user) {
      await supabase.from("profiles").update({ [key]: value } as any).eq("user_id", user.id);
      toast.success(t("settings.saved"));
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/auth");
    } catch {
      toast.error(t("auth.error"));
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t("settings.deleteAccountConfirm"))) return;
    if (!confirm(language === "he" ? "אישור אחרון - האם אתה בטוח לחלוטין?" : "Final confirmation - are you absolutely sure?")) return;
    setDeleting(true);
    try {
      await supabase.rpc("delete_own_account");
      await signOut();
      navigate("/");
      toast.success(language === "he" ? "החשבון נמחק" : "Account deleted");
    } catch {
      toast.error(t("auth.error"));
    } finally {
      setDeleting(false);
    }
  };

  const handleClearCache = async () => {
    try {
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
      localStorage.removeItem("dataSaver");
      localStorage.removeItem("autoPlay");
      toast.success(t("settings.cacheCleared"));
    } catch {
      toast.error(t("auth.error"));
    }
  };

  const commentOptions = [
    { value: "everyone", label: t("settings.commentEveryone") },
    { value: "followers", label: t("settings.commentFollowers") },
    { value: "none", label: t("settings.commentNone") },
  ];

  // iOS-style section
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{title}</h2>
      <div className="rounded-xl bg-card border border-border overflow-hidden divide-y divide-border">{children}</div>
    </section>
  );

  const Row = ({ icon: Icon, iconColor, label, desc, right, onClick, danger }: {
    icon: typeof User; iconColor?: string; label: string; desc?: string; right?: React.ReactNode; onClick?: () => void; danger?: boolean;
  }) => {
    const content = (
      <>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${danger ? "bg-destructive/10" : iconColor || "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${danger ? "text-destructive" : iconColor ? "" : "text-primary"}`} />
        </div>
        <div className="flex-1 min-w-0 text-start">
          <p className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{label}</p>
          {desc && <p className="text-[11px] text-muted-foreground">{desc}</p>}
        </div>
        {right || (onClick && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />)}
      </>
    );

    if (onClick) {
      return (
        <button
          onClick={onClick}
          className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50 ${danger ? "text-destructive" : "text-foreground"}`}
        >
          {content}
        </button>
      );
    }

    return (
      <div className={`w-full flex items-center gap-3 px-4 py-3.5 ${danger ? "text-destructive" : "text-foreground"}`}>
        {content}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-4">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border safe-top">
        <div className="mx-auto max-w-[480px] flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
        </button>
        <h1 className="font-display text-xl text-foreground tracking-wide">{t("settings.title")}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[480px] px-4 pt-16 space-y-6 pb-4">
        {/* Account */}
        {user && (
          <Section title={t("settings.account")}>
            <Row icon={User} label={t("settings.editProfile")} desc={t("settings.editProfileDesc")} onClick={() => setEditOpen(true)} />
            <Row icon={Mail} label={t("settings.changeEmail")} desc={user.email || ""} onClick={() => setEmailOpen(true)} />
          </Section>
        )}

        {/* Appearance */}
        <Section title={t("settings.appearance")}>
          <Row
            icon={theme === "dark" ? Moon : Sun}
            iconColor={theme === "dark" ? "bg-indigo-500/10 text-indigo-400" : "bg-amber-500/10 text-amber-500"}
            label={theme === "dark" ? t("settings.darkMode") : t("settings.lightMode")}
            right={<Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />}
          />
          <Row
            icon={Globe}
            iconColor="bg-green-500/10 text-green-500"
            label={t("settings.language")}
            desc={language === "he" ? "עברית" : "English"}
            right={<Switch checked={language === "he"} onCheckedChange={(c) => setLanguage(c ? "he" : "en")} />}
          />
        </Section>

        {/* Privacy */}
        {user && (
          <Section title={t("settings.privacy")}>
            <Row
              icon={Lock}
              label={t("settings.privateProfile")}
              desc={t("settings.privateProfileDesc")}
              right={<Switch checked={settings.private_profile} onCheckedChange={(v) => updateSetting("private_profile", v)} />}
            />
            <div className="px-4 py-3.5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-sm font-medium text-foreground">{t("settings.commentPrivacy")}</p>
              </div>
              <div className="flex gap-2 ps-11">
                {commentOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSetting("comment_privacy", opt.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      settings.comment_privacy === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* Notifications */}
        {user && (
          <Section title={t("settings.notifications")}>
            {([
              { key: "notify_followers", label: t("settings.notifyFollowers"), icon: User, color: "bg-blue-500/10 text-blue-500" },
              { key: "notify_likes", label: t("settings.notifyLikes"), icon: Bell, color: "bg-pink-500/10 text-pink-500" },
              { key: "notify_comments", label: t("settings.notifyComments"), icon: MessageCircle, color: "bg-green-500/10 text-green-500" },
              { key: "notify_messages", label: t("settings.notifyMessages"), icon: Mail, color: "bg-orange-500/10 text-orange-500" },
            ] as const).map((item) => (
              <Row
                key={item.key}
                icon={item.icon}
                iconColor={item.color}
                label={item.label}
                right={
                  <Switch
                    checked={settings[item.key as keyof UserSettings] as boolean}
                    onCheckedChange={(v) => updateSetting(item.key, v)}
                  />
                }
              />
            ))}
          </Section>
        )}

        {/* Content & Media */}
        <Section title={t("settings.contentMedia")}>
          <Row
            icon={Wifi}
            iconColor="bg-teal-500/10 text-teal-500"
            label={t("settings.dataSaver")}
            desc={t("settings.dataSaverDesc")}
            right={<Switch checked={dataSaver} onCheckedChange={(v) => { setDataSaver(v); localStorage.setItem("dataSaver", String(v)); }} />}
          />
          <Row
            icon={Play}
            iconColor="bg-violet-500/10 text-violet-500"
            label={t("settings.autoPlay")}
            desc={t("settings.autoPlayDesc")}
            right={<Switch checked={autoPlay} onCheckedChange={(v) => { setAutoPlay(v); localStorage.setItem("autoPlay", String(v)); }} />}
          />
        </Section>

        {/* Admin */}
        {user && isAdmin && (
          <Section title={language === "he" ? "ניהול" : "Admin"}>
            <Row icon={Shield} label={t("admin.title")} onClick={() => window.open("https://onflick-hoops-show.lovable.app/admin", "_blank")} />
          </Section>
        )}

        {/* Support */}
        <Section title={t("settings.support")}>
          <Row icon={FileText} iconColor="bg-slate-500/10 text-slate-500" label={t("settings.terms")} onClick={() => navigate("/terms")} />
          <Row icon={FileText} iconColor="bg-slate-500/10 text-slate-500" label={t("settings.privacyPolicy")} onClick={() => navigate("/privacy")} />
          <Row icon={HardDrive} iconColor="bg-cyan-500/10 text-cyan-500" label={t("settings.clearCache")} desc={t("settings.clearCacheDesc")} onClick={handleClearCache} />
        </Section>

        {/* Danger Zone */}
        {user && (
          <Section title={t("settings.dangerZone")}>
            <Row
              icon={LogOut}
              label={t("settings.signOut")}
              danger
              onClick={handleSignOut}
              right={signingOut ? <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" /> : undefined}
            />
            <Row
              icon={Trash2}
              label={t("settings.deleteAccount")}
              desc={t("settings.deleteAccountDesc")}
              danger
              onClick={handleDeleteAccount}
              right={deleting ? <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" /> : undefined}
            />
          </Section>
        )}
      </div>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} profile={profile} onSaved={fetchProfile} />
      {user && <ChangeEmailDialog open={emailOpen} onOpenChange={setEmailOpen} currentEmail={user.email || ""} />}
      <BottomNav />
    </div>
  );
};

export default Settings;
