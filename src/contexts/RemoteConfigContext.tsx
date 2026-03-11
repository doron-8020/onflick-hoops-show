import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { adminPanel } from "@/lib/adminPanelClient";

interface AppSettings {
  maintenance: { enabled: boolean; message?: string };
  banner: { enabled: boolean; text_he?: string; text_en?: string };
}

interface TrendingHashtag {
  tag: string;
  pinned: boolean;
  hidden: boolean;
}

interface RemoteConfigState {
  featureFlags: Record<string, boolean>;
  settings: AppSettings;
  trendingHashtags: TrendingHashtag[];
  loading: boolean;
  isFeatureEnabled: (key: string) => boolean;
  refetch: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  maintenance: { enabled: false },
  banner: { enabled: false },
};

const RemoteConfigContext = createContext<RemoteConfigState>({
  featureFlags: {},
  settings: defaultSettings,
  trendingHashtags: [],
  loading: true,
  isFeatureEnabled: () => true,
  refetch: async () => {},
});

export const useRemoteConfig = () => useContext(RemoteConfigContext);

export const RemoteConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const [flagsRes, settingsRes, hashtagsRes] = await Promise.all([
        adminPanel.from("feature_flags").select("key, enabled"),
        adminPanel.from("app_settings").select("key, value, updated_at"),
        adminPanel.from("trending_hashtags").select("tag, pinned, hidden"),
      ]);

      // Feature flags
      if (flagsRes.data) {
        const flags: Record<string, boolean> = {};
        flagsRes.data.forEach((f: any) => {
          flags[f.key] = f.enabled;
        });
        setFeatureFlags(flags);
      }

      // App settings (value is a JSON column)
      if (settingsRes.data) {
        const newSettings = { ...defaultSettings };
        settingsRes.data.forEach((s: any) => {
          const val = s.value || {};
          if (s.key === "maintenance") {
            newSettings.maintenance = { enabled: val.enabled ?? false, message: val.message };
          } else if (s.key === "banner") {
            newSettings.banner = {
              enabled: val.enabled ?? false,
              text_he: val.text_he,
              text_en: val.text_en,
            };
          }
        });
        setSettings(newSettings);
      }

      // Trending hashtags
      if (hashtagsRes.data) {
        setTrendingHashtags(hashtagsRes.data as TrendingHashtag[]);
      }
    } catch (err) {
      console.error("Failed to load remote config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    // Refresh every 60 seconds
    const interval = setInterval(fetchConfig, 60_000);
    return () => clearInterval(interval);
  }, [fetchConfig]);

  const isFeatureEnabled = useCallback(
    (key: string) => featureFlags[key] ?? true,
    [featureFlags]
  );

  return (
    <RemoteConfigContext.Provider
      value={{ featureFlags, settings, trendingHashtags, loading, isFeatureEnabled, refetch: fetchConfig }}
    >
      {children}
    </RemoteConfigContext.Provider>
  );
};
