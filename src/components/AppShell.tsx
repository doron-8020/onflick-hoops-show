import { useState, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBadgeCount } from "@/hooks/useBadgeCount";
import InstallPrompt from "@/components/InstallPrompt";
import DesktopSidebar from "@/components/DesktopSidebar";
import { Ban, Snowflake } from "lucide-react";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { user, userStatus, signOut, userType, userTypeLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useBadgeCount();

  useEffect(() => {
    if (!user) return;
    if (userTypeLoading) return;
    const path = location.pathname;
    const onRoleOnboarding = path === "/onboarding/role";
    const onAuth = path === "/auth";
    if (!userType && !onRoleOnboarding && !onAuth) {
      navigate("/onboarding/role", { replace: true });
    }
    if (userType && onRoleOnboarding) {
      navigate("/", { replace: true });
    }
  }, [user, userType, userTypeLoading, location.pathname, navigate]);

  useEffect(() => {
    if (user && location.pathname === "/" && localStorage.getItem("show-install-prompt") === "true") {
      localStorage.removeItem("show-install-prompt");
      const timer = setTimeout(() => setShowInstallPrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user) return;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;
    const lastReminder = localStorage.getItem("ios-install-reminder");
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (lastReminder && Date.now() - parseInt(lastReminder) < sevenDays) return;
    const timer = setTimeout(() => {
      setShowInstallPrompt(true);
      localStorage.setItem("ios-install-reminder", Date.now().toString());
    }, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  if (user && (userStatus === "blocked" || userStatus === "frozen") && location.pathname !== "/auth") {
    const isBlocked = userStatus === "blocked";
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className={`rounded-full p-6 mb-4 ${isBlocked ? "bg-destructive/10" : "bg-accent/10"}`}>
          {isBlocked ? <Ban className="h-12 w-12 text-destructive" /> : <Snowflake className="h-12 w-12 text-accent" />}
        </div>
        <h1 className="font-display text-2xl text-foreground mb-2">
          {isBlocked ? t("account.blocked") : t("account.frozen")}
        </h1>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          {isBlocked ? t("account.blockedDesc") : t("account.frozenDesc")}
        </p>
        <button
          onClick={async () => { await signOut(); navigate("/auth"); }}
          className="rounded-xl bg-secondary px-6 py-2.5 text-sm font-semibold text-foreground"
        >
          {t("account.signOut")}
        </button>
      </div>
    );
  }

  const noSidebarPaths = ["/auth", "/onboarding/role", "/reset-password"];
  const showSidebar = !noSidebarPaths.includes(location.pathname);

  return (
    <>
      <div className={showSidebar ? "flex min-h-screen w-full bg-background" : ""}>
        {showSidebar && <DesktopSidebar />}
        <div className={showSidebar ? "flex-1 flex justify-center min-w-0" : ""}>
          <div className={showSidebar ? "w-full max-w-[480px]" : "w-full"}>
            {children}
          </div>
        </div>
      </div>
      <InstallPrompt show={showInstallPrompt} onClose={() => setShowInstallPrompt(false)} />
    </>
  );
};

export default AppShell;
