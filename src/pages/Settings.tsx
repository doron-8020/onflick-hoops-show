import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon, Globe, LogOut, Shield } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch {
      toast.error(t("auth.error"));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-lg border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
        </button>
        <h1 className="font-display text-xl text-foreground tracking-wide">
          {t("settings.title")}
        </h1>
      </div>

      <div className="px-4 pt-16 space-y-6">
        {/* Appearance Section */}
        <section>
          <h2 className="font-display text-lg text-foreground mb-3 tracking-wide">
            {t("settings.appearance")}
          </h2>
          <div className="rounded-xl bg-card border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-foreground" />
              )}
              <Label className="text-sm text-foreground">
                {theme === "dark" ? t("settings.darkMode") : t("settings.lightMode")}
              </Label>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
        </section>

        {/* Language Section */}
        <section>
          <h2 className="font-display text-lg text-foreground mb-3 tracking-wide">
            {t("settings.language")}
          </h2>
          <div className="rounded-xl bg-card border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-foreground" />
              <Label className="text-sm text-foreground">
                {t("settings.hebrew")}
              </Label>
            </div>
            <Switch
              checked={language === "he"}
              onCheckedChange={(checked) => setLanguage(checked ? "he" : "en")}
            />
          </div>
        </section>

        {/* Account Section */}
        {user && (
          <section>
            <h2 className="font-display text-lg text-foreground mb-3 tracking-wide">
              {t("settings.account")}
            </h2>
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5 text-destructive" />
                <span className="flex-1 text-sm text-destructive text-start font-medium">
                  {t("settings.signOut")}
                </span>
              </button>
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
