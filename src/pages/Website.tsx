import { Link } from "react-router-dom";
import { ArrowRight, Play, Users, Camera, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const fade = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const Website = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
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

      {/* Hero */}
      <section className="relative flex items-center justify-center min-h-screen px-6 pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-black to-black" />
        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fade}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-none mb-6 tracking-wider">
            YOUR GAME.<br />
            <span className="text-primary">YOUR STAGE.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            The basketball media platform where players showcase highlights, 
            connect with scouts, and build their brand.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
            <button className="rounded-full border border-white/20 px-8 py-3.5 text-base font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2">
              <Play className="h-5 w-5" /> Watch Demo
            </button>
          </div>
        </motion.div>
      </section>

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
