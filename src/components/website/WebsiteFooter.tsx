import { Link } from "react-router-dom";

const WebsiteFooter = () => (
  <footer className="border-t border-white/10 py-8 px-6">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <span className="font-display text-xl text-primary tracking-wider">ONFLICK</span>
      <div className="flex gap-6 text-sm text-white/40">
        <Link to="/website/about" className="hover:text-white transition-colors">אודות</Link>
        <Link to="/website/gallery" className="hover:text-white transition-colors">גלריה</Link>
        <Link to="/website/contact" className="hover:text-white transition-colors">צור קשר</Link>
        <Link to="/terms" className="hover:text-white transition-colors">תנאי שימוש</Link>
        <Link to="/privacy" className="hover:text-white transition-colors">פרטיות</Link>
      </div>
      <span className="text-xs text-white/30">© {new Date().getFullYear()} ONFLICK</span>
    </div>
  </footer>
);

export default WebsiteFooter;
