import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";

const navLinks = [
  { label: "ראשי", path: "/website" },
  { label: "פור יו", path: "/website/feed" },
  { label: "אודות", path: "/website/about" },
  { label: "גלריה", path: "/website/gallery" },
  { label: "צור קשר", path: "/website/contact" },
];

const FloatingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDarkBg, setIsDarkBg] = useState(true);
  const navRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Detect background brightness behind nav
  const detectBackground = useCallback(() => {
    if (!navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const samplePoints = [
      { x: navRect.left + navRect.width * 0.25, y: navRect.bottom + 2 },
      { x: navRect.left + navRect.width * 0.5, y: navRect.bottom + 2 },
      { x: navRect.left + navRect.width * 0.75, y: navRect.bottom + 2 },
    ];

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let totalBrightness = 0;
      let validSamples = 0;

      samplePoints.forEach((point) => {
        const el = document.elementFromPoint(point.x, point.y);
        if (el) {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const match = bg.match(/\d+/g);
          if (match && match.length >= 3) {
            const [r, g, b] = match.map(Number);
            totalBrightness += (r * 299 + g * 587 + b * 114) / 1000;
            validSamples++;
          }
        }
      });

      if (validSamples > 0) {
        setIsDarkBg(totalBrightness / validSamples < 128);
      }
    } catch {
      // fallback: assume dark
      setIsDarkBg(true);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      detectBackground();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    detectBackground();
    return () => window.removeEventListener("scroll", onScroll);
  }, [detectBackground]);

  // Re-detect on route change
  useEffect(() => {
    const timer = setTimeout(detectBackground, 300);
    return () => clearTimeout(timer);
  }, [location.pathname, detectBackground]);

  // Adaptive text colors based on background
  const textColor = isDarkBg ? "text-white/90" : "text-black/80";
  const textMuted = isDarkBg ? "text-white/45" : "text-black/45";
  const activeColor = isDarkBg ? "text-white" : "text-black";
  const logoColor = "text-primary";
  const borderColor = isDarkBg ? "border-white/10" : "border-black/10";

  return (
    <header
      ref={navRef}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? `${isDarkBg ? "bg-black/60" : "bg-white/60"} backdrop-blur-xl ${borderColor} border-b`
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/website" className={`font-display text-3xl ${logoColor} tracking-wider`}>
          ONFLICK
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-sm font-semibold transition-colors pb-1 ${
                  isActive ? activeColor : `${textMuted} hover:${textColor}`
                }`}
              >
                {/* Basketball indicator above active tab */}
                {isActive && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] leading-none">
                    🏀
                  </span>
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/"
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          APP
        </Link>
      </div>
    </header>
  );
};

export default FloatingNav;
