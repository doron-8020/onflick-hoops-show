import { Search, Users, Compass } from "lucide-react";
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
    if (location.pathname === "/onflick") return "onflick";
    return "";
  })();

  const handleTabClick = (tab: string) => {
    if (tab === "foryou") navigate("/");
    if (tab === "following") navigate("/?tab=following");
    if (tab === "explore") navigate("/discover");
    if (tab === "blog") navigate("/blog");
    if (tab === "onflick") navigate("/onflick");
  };

  const tabs = [
    { key: "foryou", label: t("feed.foryou") },
    { key: "following", icon: Users, ariaLabel: t("feed.following") },
    { key: "explore", icon: Compass, ariaLabel: t("feed.explore") },
    { key: "blog", label: t("feed.blog") },
    { key: "onflick", label: t("feed.onflick"), isAccent: true },
  ] as const;

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

        <div className="relative flex items-center gap-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = "icon" in tab ? tab.icon : null;
            const isAccent = "isAccent" in tab && tab.isAccent;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`relative text-sm font-semibold transition-all duration-200 pb-1 ${
                  isAccent
                    ? isActive
                      ? "text-destructive"
                      : "text-destructive/70 hover:text-destructive"
                    : isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                }`}
                aria-label={"ariaLabel" in tab ? tab.ariaLabel : undefined}
              >
                {Icon ? (
                  <Icon className="h-4.5 w-4.5" />
                ) : (
                  "label" in tab ? tab.label : null
                )}

                {isActive && (
                  <motion.div
                    layoutId="feedTabIndicator"
                    className={`absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full ${
                      isAccent ? "bg-destructive" : "bg-primary"
                    }`}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="w-7" />
      </div>
    </div>
  );
};

export default FeedHeader;
