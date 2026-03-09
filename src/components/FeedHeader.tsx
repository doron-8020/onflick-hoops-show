import { Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const FeedHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const activeTab = (() => {
    if (location.pathname === "/") {
      const tab = new URLSearchParams(location.search).get("tab");
      return tab === "following" ? "following" : "foryou";
    }
    if (location.pathname === "/discover") return "explore";
    if (location.pathname === "/blog") return "blog";
    return "";
  })();

  const handleTabClick = (tab: string) => {
    if (tab === "foryou") navigate("/");
    if (tab === "following") navigate("/?tab=following");
    if (tab === "explore") navigate("/discover");
    if (tab === "blog") navigate("/blog");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="mx-auto w-full max-w-lg flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background via-background/80 to-transparent">
        <button
          onClick={() => navigate("/discover")}
          className="p-1 rounded-full hover:bg-secondary/50 transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-foreground" />
        </button>

        <div className="relative flex items-center gap-5">
          {(["foryou", "following", "explore", "blog"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`relative text-sm font-semibold transition-all duration-200 pb-1 ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {tab === "foryou" && t("feed.foryou")}
                {tab === "following" && t("feed.following")}
                {tab === "explore" && t("feed.explore")}
                {tab === "blog" && t("feed.blog")}

                {isActive && (
                  <motion.div
                    layoutId="feedTabIndicator"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}

          <button
            onClick={() => navigate("/")}
            className="ms-2 rounded-full gradient-fire px-3 py-1 text-xs font-bold text-primary-foreground shadow-glow"
          >
            {t("feed.onflick")}
          </button>
        </div>

        <div className="w-7" />
      </div>
    </div>
  );
};

export default FeedHeader;

