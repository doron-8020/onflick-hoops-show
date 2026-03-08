import { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";

interface InstallPromptProps {
  show: boolean;
  onClose: () => void;
}

const InstallPrompt = ({ show, onClose }: InstallPromptProps) => {
  const { canInstall, isInstalled, promptInstall, isIOS } = usePWAInstall();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && !isInstalled) {
      // Small delay for animation
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [show, isInstalled]);

  // Don't show if already installed or dismissed before
  if (!visible || isInstalled) return null;

  const handleInstall = async () => {
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) {
        onClose();
      }
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    onClose();
  };

  // Check if dismissed recently (within 3 days)
  const dismissedAt = localStorage.getItem("pwa-install-dismissed");
  if (dismissedAt && Date.now() - parseInt(dismissedAt) < 3 * 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-card p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 end-4 p-1.5 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="gradient-fire rounded-2xl p-4 shadow-glow">
            <Download className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="font-display text-2xl text-foreground mb-1">
            {t("install.title")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("install.description")}
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          {["install.benefit1", "install.benefit2", "install.benefit3"].map((key) => (
            <div key={key} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-xs text-foreground/80">{t(key as any)}</span>
            </div>
          ))}
        </div>

        {isIOS ? (
          /* iOS instructions */
          <div className="rounded-xl bg-secondary p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground text-center">
              {t("install.iosTitle")}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background shrink-0">
                <Share className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">{t("install.iosStep1")}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background shrink-0">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">{t("install.iosStep2")}</p>
            </div>
          </div>
        ) : canInstall ? (
          <button
            onClick={handleInstall}
            className="w-full rounded-xl gradient-fire py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-all active:scale-[0.98]"
          >
            {t("install.installButton")}
          </button>
        ) : (
          <div className="rounded-xl bg-secondary p-4">
            <p className="text-xs text-muted-foreground text-center">
              {t("install.browserMenu")}
            </p>
          </div>
        )}

        <button
          onClick={handleDismiss}
          className="w-full text-center text-xs text-muted-foreground py-1"
        >
          {t("install.notNow")}
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
