import { Phone, Mail, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import FeedHeader from "@/components/FeedHeader";

const SocialIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, string> = {
    instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
    tiktok: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.49a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.28z",
    facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    youtube: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d={icons[platform] || ""} />
    </svg>
  );
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const Onflick = () => {
  const { language } = useLanguage();
  const isHe = language === "he";

  const contactLinks = [
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: isHe ? "וואטסאפ" : "WhatsApp",
      href: "https://wa.me/972501234567",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      icon: <Phone className="h-5 w-5" />,
      label: isHe ? "טלפון" : "Phone",
      href: "tel:+972501234567",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      icon: <Mail className="h-5 w-5" />,
      label: isHe ? "אימייל" : "Email",
      href: "mailto:info@onflick.com",
      color: "bg-[hsl(25,85%,50%)] hover:bg-[hsl(25,85%,45%)]",
    },
  ];

  const socialLinks = [
    { platform: "instagram", label: "Instagram", href: "https://instagram.com/onflick" },
    { platform: "tiktok", label: "TikTok", href: "https://tiktok.com/@onflick" },
    { platform: "facebook", label: "Facebook", href: "https://facebook.com/onflick" },
    { platform: "youtube", label: "YouTube", href: "https://youtube.com/@onflick" },
    { platform: "x", label: "X", href: "https://x.com/onflick" },
  ];

  const bulletPoints = isHe
    ? [
        "בניית נוכחות מקצועית ברשת",
        "יצירת היילייטים לשחקנים",
        "תיעוד משחקים ואירועים",
        "הצגת הקבוצה בצורה מקצועית",
      ]
    : [
        "Building a professional online presence",
        "Creating player highlights",
        "Documenting games and events",
        "Showcasing the team professionally",
      ];

  return (
    <div className="min-h-screen bg-background pb-24" dir={isHe ? "rtl" : "ltr"}>
      <FeedHeader />

      <div className="mx-auto max-w-lg px-4 pt-16">
        {/* Hero */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="text-center py-10"
        >
          <h1 className="font-display text-6xl tracking-tight text-foreground mb-2">
            <span className="text-destructive">ON</span>FLICK
          </h1>
          <div className="h-1 w-20 mx-auto rounded-full bg-destructive mb-4" />
          <p className="font-display text-lg text-muted-foreground tracking-wide">
            {isHe ? "צילום שמספר את המשחק" : "Photography that tells the game"}
          </p>
        </motion.div>

        {/* Main content - beautifully styled */}
        <div className="space-y-8">
          {/* Intro */}
          <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
            <div className="rounded-2xl bg-card border border-border p-6">
              <p className="text-sm leading-7 text-foreground/90">
                {isHe
                  ? "ONFLICK היא חברת מדיה המתמחה ביצירת תוכן מקצועי לכדורסל. המטרה שלה פשוטה: להפוך רגעים אמיתיים מהמגרש לתוכן שמספר סיפור — של שחקן, של קבוצה, ושל משחק."
                  : "ONFLICK is a media company specializing in creating professional basketball content. Its goal is simple: to turn real moments from the court into content that tells a story — of a player, a team, and a game."}
              </p>
            </div>
          </motion.div>

          {/* Origin */}
          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
            <div className="rounded-2xl bg-gradient-to-br from-card to-secondary/50 border border-border p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">🏀</span>
                <h3 className="font-display text-xl text-foreground">
                  {isHe ? "מהפרקט" : "From the Court"}
                </h3>
              </div>
              <p className="text-sm leading-7 text-foreground/80">
                {isHe
                  ? "החברה הוקמה מתוך עולם הכדורסל עצמו. לא מתוך סטודיו פרסומי, אלא מתוך היכרות עמוקה עם מה שקורה על הפרקט: הקצב, הרגעים הקטנים, והדקות שבהן משחק משתנה."
                  : "The company was born from the basketball world itself. Not from an advertising studio, but from a deep familiarity with what happens on the court: the rhythm, the small moments, and the minutes where a game changes."}
              </p>
            </div>
          </motion.div>

          {/* Focus */}
          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
            <div className="rounded-2xl bg-card border border-border p-6">
              <p className="text-sm leading-7 text-foreground/90">
                {isHe
                  ? "ONFLICK מתמקדת בצילום משחקים, יצירת היילייטים ותוכן דיגיטלי שמאפשר לקבוצות ולשחקנים להציג את עצמם בצורה מקצועית ברשת."
                  : "ONFLICK focuses on game photography, creating highlights, and digital content that allows teams and players to present themselves professionally online."}
              </p>
            </div>
          </motion.div>

          {/* Philosophy - accent card */}
          <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
            <div className="rounded-2xl gradient-fire p-[1px]">
              <div className="rounded-2xl bg-card p-6">
                <p className="font-display text-lg text-center text-foreground leading-relaxed">
                  {isHe
                    ? "\"כדורסל אמיתי צריך להיראות כמו שהוא מרגיש על המגרש.\""
                    : "\"Real basketball should look the way it feels on the court.\""}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Real moments */}
          <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
            <div className="rounded-2xl bg-card border border-border p-6">
              <p className="text-sm leading-7 text-foreground/80 mb-4">
                {isHe
                  ? "לכן הצילום מתמקד ברגעים האמיתיים של המשחק:"
                  : "That's why the photography focuses on the real moments of the game:"}
              </p>
              <div className="space-y-3">
                {(isHe
                  ? [
                      "🏀 דריבל שמפרק הגנה",
                      "🎯 זריקה שנכנסת בשנייה האחרונה",
                      "💥 הטבעה שמשנה את האווירה באולם",
                    ]
                  : [
                      "🏀 A dribble that breaks the defense",
                      "🎯 A shot that goes in at the last second",
                      "💥 A dunk that changes the arena's energy",
                    ]
                ).map((item, i) => (
                  <p key={i} className="text-sm text-foreground/90 font-medium">{item}</p>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Bullet points */}
          <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
            <div className="rounded-2xl bg-secondary/50 border border-border p-6">
              <h3 className="font-display text-lg text-foreground mb-4">
                {isHe ? "התוכן שנוצר משמש:" : "The content serves:"}
              </h3>
              <div className="space-y-3">
                {bulletPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                    <p className="text-sm text-foreground/85">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Community */}
          <motion.div initial="hidden" animate="visible" custom={7} variants={fadeUp}>
            <div className="rounded-2xl bg-card border border-border p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">🤝</span>
                <h3 className="font-display text-xl text-foreground">
                  {isHe ? "קהילה" : "Community"}
                </h3>
              </div>
              <p className="text-sm leading-7 text-foreground/80">
                {isHe
                  ? "מעבר לצילום עצמו, ONFLICK פועלת גם כמותג בתוך קהילת הכדורסל. החברה מארגנת אירועי משחקים פתוחים (Open Run), ימי צילום מיוחדים ותוכן שמחבר בין שחקנים, קבוצות ואוהבי כדורסל."
                  : "Beyond photography, ONFLICK also operates as a brand within the basketball community. The company organizes open run events, special photo days, and content that connects players, teams, and basketball fans."}
              </p>
            </div>
          </motion.div>

          {/* Closing statement - fire border */}
          <motion.div initial="hidden" animate="visible" custom={8} variants={fadeUp}>
            <div className="rounded-2xl gradient-fire p-[1px]">
              <div className="rounded-2xl bg-background p-6 text-center">
                <p className="text-sm leading-7 text-foreground/80 mb-3">
                  {isHe
                    ? "כישרון יש להרבה שחקנים. אבל כדי שיראו אותו — צריך גם לדעת להציג אותו."
                    : "Many players have talent. But for it to be seen — you also need to know how to present it."}
                </p>
                <p className="font-display text-2xl text-destructive">
                  {isHe
                    ? "ובדיוק שם ONFLICK נכנסת למשחק."
                    : "And that's exactly where ONFLICK enters the game."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features grid */}
        <motion.div initial="hidden" animate="visible" custom={9} variants={fadeUp} className="mt-10 mb-8">
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "🎬", title: isHe ? "הדגשות" : "Highlights", desc: isHe ? "שתף את הרגעים הטובים" : "Share your best moments" },
              { emoji: "📊", title: isHe ? "פרופיל אתלטי" : "Athletic Profile", desc: isHe ? "נתונים ומדדים" : "Stats & measurements" },
              { emoji: "🔍", title: isHe ? "סקאוטינג" : "Scouting", desc: isHe ? "חשיפה לסקאוטים" : "Get discovered" },
              { emoji: "🏀", title: isHe ? "קהילה" : "Community", desc: isHe ? "התחבר לשחקנים" : "Connect with players" },
            ].map((feature, i) => (
              <div key={i} className="rounded-xl bg-card border border-border p-4 text-center">
                <span className="text-2xl mb-2 block">{feature.emoji}</span>
                <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div initial="hidden" animate="visible" custom={10} variants={fadeUp} className="mb-8">
          <h2 className="font-display text-xl text-foreground mb-4 text-center">
            {isHe ? "צור קשר" : "Contact Us"}
          </h2>
          <div className="flex gap-3">
            {contactLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 flex flex-col items-center gap-2 rounded-xl py-4 text-white transition-all active:scale-95 ${link.color}`}
              >
                {link.icon}
                <span className="text-xs font-semibold">{link.label}</span>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Social media */}
        <motion.div initial="hidden" animate="visible" custom={11} variants={fadeUp} className="mb-8">
          <h2 className="font-display text-xl text-foreground mb-4 text-center">
            {isHe ? "עקבו אחרינו" : "Follow Us"}
          </h2>
          <div className="flex justify-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                aria-label={link.label}
              >
                <SocialIcon platform={link.platform} />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ONFLICK. {isHe ? "כל הזכויות שמורות." : "All rights reserved."}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Onflick;
