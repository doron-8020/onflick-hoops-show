import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Home", path: "/website" },
  { label: "For You", path: "/" },
  { label: "About", path: "/website/about" },
  { label: "Gallery", path: "/website/gallery" },
  { label: "Contact", path: "/website/contact" },
];

const FloatingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-md border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/website" className="font-display text-3xl text-primary tracking-wider">
          ONFLICK
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/"
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Open App
        </Link>
      </div>
    </header>
  );
};

export default FloatingNav;
