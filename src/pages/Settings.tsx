import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon, Globe, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
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
          <ArrowLeft className="h-5 w-5 text-foreground" />
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
          <div className="rounded-xl bg-card border border-border overflow-hidden divide-y divide-border">
            <button
              onClick={() => setTheme("dark")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${
                theme === "dark" ? "bg-primary/10" : ""
              }`}
            >
              <Moon className="h-5 w-5 text-foreground" />
              <span className="flex-1 text-sm text-foreground text-start">
                {t("settings.darkMode")}
              </span>
              {theme === "dark" && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${
                theme === "light" ? "bg-primary/10" : ""
              }`}
            >
              <Sun className="h-5 w-5 text-foreground" />
              <span className="flex-1 text-sm text-foreground text-start">
                {t("settings.lightMode")}
              </span>
              {theme === "light" && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </section>

        {/* Language Section */}
        <section>
          <h2 className="font-display text-lg text-foreground mb-3 tracking-wide">
            {t("settings.language")}
          </h2>
          <div className="rounded-xl bg-card border border-border overflow-hidden divide-y divide-border">
            <button
              onClick={() => setLanguage("he")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${
                language === "he" ? "bg-primary/10" : ""
              }`}
            >
              <Globe className="h-5 w-5 text-foreground" />
              <span className="flex-1 text-sm text-foreground text-start">
                {t("settings.hebrew")}
              </span>
              {language === "he" && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${
                language === "en" ? "bg-primary/10" : ""
              }`}
            >
              <Globe className="h-5 w-5 text-foreground" />
              <span className="flex-1 text-sm text-foreground text-start">
                {t("settings.english")}
              </span>
              {language === "en" && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </button>
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
