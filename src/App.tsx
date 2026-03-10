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
import AppShell from "./components/AppShell";

const queryClient = new QueryClient();

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
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/discover" element={<Discover />} />
                    <Route path="/create" element={<Create />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/player/:userId" element={<PlayerProfile />} />
                    <Route path="/profile/feed" element={<ProfileFeed />} />
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

