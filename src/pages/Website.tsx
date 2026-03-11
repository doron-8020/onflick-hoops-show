import { Link } from "react-router-dom";
import { ArrowRight, Users, Camera, Trophy } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const fade = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const VideoHero = ({
  videoId,
  title,
  subtitle,
}: {
  videoId: string;
  title: React.ReactNode;
  subtitle?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden">
      {/* Background video */}
      <motion.div className="absolute inset-0" style={{ scale }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1`}
          className="absolute top-1/2 left-1/2 w-[180vw] h-[180vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ border: 0 }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Hero Video"
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6"
        style={{ opacity, y: textY }}
      >
        <motion.h1
          className="font-display text-6xl md:text-8xl lg:text-[10rem] leading-[0.85] tracking-wider mb-6 drop-shadow-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            className="text-lg md:text-2xl text-white/70 max-w-2xl mb-10 font-body"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {subtitle}
          </motion.p>
        )}
        <motion.div
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Link
            to="/auth"
            className="rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 flex items-center gap-2"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-white/70"
              animate={{ y: [0, 16, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

/** Floating nav that goes transparent on scroll */
const FloatingNav = () => {
  const [scrolled, setScrolled] = useState(false);

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
        <span className="font-display text-3xl text-primary tracking-wider">ONFLICK</span>
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

const Website = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <FloatingNav />

      {/* Full-screen Video Hero */}
      <VideoHero
        videoId="6nwz_zx5jGo"
        title={
          <>
            YOUR GAME.
            <br />
            <span className="text-primary">YOUR STAGE.</span>
          </>
        }
        subtitle="The basketball media platform where players showcase highlights, connect with scouts, and build their brand."
      />

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="font-display text-4xl md:text-5xl text-center mb-16 tracking-wider"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            transition={{ duration: 0.6 }}
          >
            WHY <span className="text-primary">ONFLICK</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                title: "Share Highlights",
                desc: "Upload your best plays and moments. Vertical or landscape — we handle every format.",
              },
              {
                icon: Users,
                title: "Get Discovered",
                desc: "Scouts, coaches, and professionals browse talent daily. Put yourself on the map.",
              },
              {
                icon: Trophy,
                title: "Build Your Brand",
                desc: "Create a player profile with stats, traits, and a portfolio that speaks for itself.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:border-primary/40 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-display text-2xl mb-3 tracking-wide">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-12 md:p-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fade}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl mb-4 tracking-wider">
            READY TO <span className="text-primary">PLAY?</span>
          </h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto">
            Join the community of ballers who are taking their game to the next level.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Join Now <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl text-primary tracking-wider">ONFLICK</span>
          <div className="flex gap-6 text-sm text-white/40">
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/onflick" className="hover:text-white transition-colors">About</Link>
          </div>
          <span className="text-xs text-white/30">© {new Date().getFullYear()} ONFLICK</span>
        </div>
      </footer>
    </div>
  );
};

export default Website;
