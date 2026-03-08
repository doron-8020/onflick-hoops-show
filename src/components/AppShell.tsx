import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBadgeCount } from "@/hooks/useBadgeCount";
import InstallPrompt from "@/components/InstallPrompt";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Activate badge count on home screen icon
  useBadgeCount();

  // Show install prompt after login redirect
  useEffect(() => {
    if (user && location.pathname === "/" && localStorage.getItem("show-install-prompt") === "true") {
      localStorage.removeItem("show-install-prompt");
      // Small delay so the page loads first
      const timer = setTimeout(() => setShowInstallPrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, location.pathname]);

  return (
    <>
      {children}
      <InstallPrompt
        show={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
      />
    </>
  );
};

export default AppShell;
