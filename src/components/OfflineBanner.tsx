import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WifiOff } from "lucide-react";

const OfflineBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const { language } = useLanguage();

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-destructive py-2 px-4 animate-fade-in safe-top">
      <WifiOff className="h-4 w-4 text-destructive-foreground" />
      <span className="text-xs font-semibold text-destructive-foreground">
        {language === "he" ? "אין חיבור לאינטרנט" : "No internet connection"}
      </span>
    </div>
  );
};

export default OfflineBanner;
