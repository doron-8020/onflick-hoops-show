import { Search } from "lucide-react";
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
    if (location.pathname === "/onflick") return "onflick";
    return "";
  })();

  const handleTabClick = (tab: string) => {
    haptic(10);
    if (tab === "foryou") navigate("/");
    if (tab === "following") navigate("/?tab=following");
    if (tab === "explore") navigate("/discover");
    if (tab === "onflick") navigate("/onflick");
  };

  const tabs = [
    { key: "foryou", label: t("feed.foryou") },
    { key: "following", label: t("feed.following") },
    { key: "explore", label: t("feed.explore") },
  ];

  return (
    <div className="fixed top-0 inset-x-0 z-50 safe-top md:start-[240px]" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto w-full max-w-[480px] flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
        {/* Search icon — left */}
        <button
          onClick={() => { haptic(10); navigate("/discover"); }}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-white" />
        </button>

        {/* Center tabs: For You | Following | Explore */}
        <div className="relative flex items-center gap-5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`relative transition-all duration-200 pb-1 ${
                  isActive
                    ? "text-white text-[17px] font-bold"
                    : "text-white/55 text-[15px] font-semibold hover:text-white/70"
                }`}
              >
                {tab.label}
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

        {/* ONFLICK button — right */}
        <button
          onClick={() => { haptic(10); navigate("/onflick"); }}
          className={`text-[14px] font-bold transition-colors ${
            activeTab === "onflick" ? "text-[#FE2C55]" : "text-[#FE2C55]/60 hover:text-[#FE2C55]/80"
          }`}
        >
          {language === "he" ? "אונפליק" : "ONFLICK"}
        </button>
      </div>
    </div>
  );
};

export default FeedHeader;
