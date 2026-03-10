import { Newspaper } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const haptic = (ms = 10) => {
  try { if ("vibrate" in navigator) navigator.vibrate(ms); } catch {}
};

const FeedHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  const activeTab = (() => {
    if (location.pathname === "/") {
      const tab = new URLSearchParams(location.search).get("tab");
      return tab === "following" ? "following" : "foryou";
    }
    if (location.pathname === "/discover") return "explore";
    if (location.pathname === "/blog") return "blog";
    if (location.pathname === "/onflick") return "onflick";
    return "";
  })();

  const handleTabClick = (tab: string) => {
    haptic(10);
    if (tab === "foryou") navigate("/");
    if (tab === "following") navigate("/?tab=following");
    if (tab === "explore") navigate("/discover");
    if (tab === "blog") navigate("/blog");
    if (tab === "onflick") navigate("/onflick");
  };

  const tabs = [
    { key: "following", label: t("feed.following") },
    { key: "foryou", label: t("feed.foryou") },
    { key: "explore", label: t("feed.explore") },
    { key: "blog", icon: Newspaper, ariaLabel: t("feed.blog") },
    { key: "onflick", label: language === "he" ? "אונפליק" : "ONFLICK", isAccent: true },
  ] as const;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="mx-auto w-full max-w-lg flex items-center justify-center px-4 py-3 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
        <div className="relative flex items-center gap-5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = "icon" in tab ? tab.icon : null;
            const isAccent = "isAccent" in tab && tab.isAccent;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`relative transition-all duration-200 pb-1 ${
                  isAccent
                    ? isActive
                      ? "text-[#FE2C55] text-[15px] font-bold"
                      : "text-[#FE2C55]/55 text-[14px] font-semibold hover:text-[#FE2C55]/80"
                    : isActive
                      ? "text-white text-[17px] font-bold"
                      : "text-white/55 text-[15px] font-semibold hover:text-white/70"
                }`}
                aria-label={"ariaLabel" in tab ? tab.ariaLabel : undefined}
              >
                {Icon ? (
                  <Icon className={`h-[18px] w-[18px] ${isActive ? "text-white" : "text-white/55"}`} strokeWidth={isActive ? 2.5 : 1.5} />
                ) : (
                  "label" in tab ? tab.label : null
                )}

                {isActive && (
                  <motion.div
                    layoutId="feedTabIndicator"
                    className="absolute -bottom-0.5 left-1/4 right-1/4 h-[2px] rounded-full bg-white"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedHeader;
