import { Link, useLocation } from "react-router-dom";
import FloatingNav from "@/components/website/FloatingNav";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import Index from "@/pages/Index";

const navLinks = [
  { label: "Home", path: "/website" },
  { label: "For You", path: "/website/feed" },
  { label: "About", path: "/website/about" },
  { label: "Gallery", path: "/website/gallery" },
  { label: "Contact", path: "/website/contact" },
];

const WebsiteFeed = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Side nav for feed page */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 border-e border-white/10 bg-black/90 backdrop-blur-md px-4 py-6 z-50">
        <Link to="/website" className="font-display text-2xl text-primary tracking-wider px-3 mb-8">
          ONFLICK
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground text-center hover:bg-primary/90 transition-colors"
        >
          Open App
        </Link>
      </aside>

      {/* Feed content */}
      <div className="flex-1 flex justify-center min-w-0">
        <div className="w-full max-w-[480px]">
          <Index />
        </div>
      </div>
    </div>
  );
};

export default WebsiteFeed;
