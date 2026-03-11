import { useRemoteConfig } from "@/contexts/RemoteConfigContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wrench } from "lucide-react";

const MaintenanceScreen = () => {
  const { settings } = useRemoteConfig();
  const { language } = useLanguage();

  if (!settings.maintenance.enabled) return null;

  const message =
    settings.maintenance.message ||
    (language === "he"
      ? "האפליקציה בתחזוקה כרגע. נחזור בקרוב!"
      : "The app is currently under maintenance. We'll be back soon!");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 px-8 text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Wrench className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">ONFLICK</h1>
        <p className="text-muted-foreground text-base leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
