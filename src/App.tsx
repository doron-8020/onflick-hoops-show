import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MuteProvider } from "@/contexts/MuteContext";
import OfflineBanner from "@/components/OfflineBanner";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Create from "./pages/Create";
import Profile from "./pages/Profile";
import PlayerProfile from "./pages/PlayerProfile";
import Auth from "./pages/Auth";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import RoleOnboarding from "./pages/RoleOnboarding";
import Blog from "./pages/Blog";
import Onflick from "./pages/Onflick";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProfileFeed from "./pages/ProfileFeed";
import FollowList from "./pages/FollowList";
import TagFeed from "./pages/TagFeed";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import AppShell from "./components/AppShell";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// OG tag updater for shared video links
const OGTagUpdater = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get("v");
    if (!videoId) return;

    const updateOG = async () => {
      const { data } = await supabase
        .from("videos")
        .select("title, caption, thumbnail_url, profiles!videos_user_id_fkey(display_name, position)")
        .eq("id", videoId)
        .maybeSingle();

      if (!data) return;
      const profile = (data as any).profiles;
      const title = (data as any).title || "ONFLICK Highlight";
      const desc = [profile?.display_name, profile?.position].filter(Boolean).join(" · ");
      const image = (data as any).thumbnail_url || "/pwa-192x192.png";
      const url = window.location.href;

      const setMeta = (property: string, content: string) => {
        let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute(property.startsWith("og:") ? "property" : "name", property);
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };

      setMeta("og:title", title);
      setMeta("og:description", desc);
      setMeta("og:image", image);
      setMeta("og:url", url);
      setMeta("twitter:title", title);
      setMeta("twitter:description", desc);
      setMeta("twitter:image", image);
      document.title = `${title} | ONFLICK`;
    };

    updateOG();
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <MuteProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineBanner />
            <BrowserRouter>
              <AuthProvider>
                <OGTagUpdater />
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/discover" element={<Discover />} />
                    <Route path="/create" element={<Create />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/player/:userId" element={<PlayerProfile />} />
                    <Route path="/profile/feed" element={<ProfileFeed />} />
                    <Route path="/user/:userId/follows" element={<FollowList />} />
                    <Route path="/tag/:tagName" element={<TagFeed />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/messages/:conversationId" element={<Conversation />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/onflick" element={<Onflick />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/onboarding/role" element={<RoleOnboarding />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppShell>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </MuteProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
