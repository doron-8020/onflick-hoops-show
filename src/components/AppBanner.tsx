import { useState } from "react";
import { useRemoteConfig } from "@/contexts/RemoteConfigContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { X } from "lucide-react";

const AppBanner = () => {
  const { settings } = useRemoteConfig();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (!settings.banner.enabled || dismissed) return null;

  const text =
    (language === "he" ? settings.banner.text_he : settings.banner.text_en) || "";

  if (!text) return null;

  return (
    <div className="relative z-[100] bg-primary text-primary-foreground px-4 py-2.5 text-center text-sm font-medium safe-top">
      <span>{text}</span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AppBanner;
