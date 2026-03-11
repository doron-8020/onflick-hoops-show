import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, Heart, Zap, Users } from "lucide-react";
import FloatingNav from "@/components/website/FloatingNav";
import VideoHero from "@/components/website/VideoHero";
import WebsiteFooter from "@/components/website/WebsiteFooter";

const fade = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const WebsiteAbout = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <FloatingNav />

      <VideoHero
        videoId="6nwz_zx5jGo"
        title={
          <>
            ABOUT <span className="text-primary">ONFLICK</span>
          </>
        }
        subtitle="We're a basketball media company on a mission to give every player a stage."
      />
            variants={fade}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            We're a basketball media company on a mission to give every player a stage.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl tracking-wider mb-6">
              OUR <span className="text-primary">STORY</span>
            </h2>
            <p className="text-white/50 leading-relaxed mb-4">
              ONFLICK was born from a simple belief: talent shouldn't go unnoticed. 
              We saw countless ballers grinding on courts every day — players with real skill, 
              real hustle — but no platform built for them.
            </p>
            <p className="text-white/50 leading-relaxed">
              So we built one. A space where highlights speak louder than words, 
              where scouts discover the next generation, and where every player 
              can build their brand from the ground up.
            </p>
          </motion.div>
          <motion.div
            className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="font-display text-6xl text-primary mb-2">🏀</div>
            <p className="font-display text-2xl tracking-wider mb-1">BASKETBALL FIRST</p>
            <p className="text-white/40 text-sm">Everything we do revolves around the game.</p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="font-display text-3xl md:text-4xl text-center tracking-wider mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
          >
            WHAT WE <span className="text-primary">STAND FOR</span>
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: "Exposure", desc: "Every player deserves to be seen." },
              { icon: Heart, title: "Community", desc: "Built by ballers, for ballers." },
              { icon: Zap, title: "Innovation", desc: "Pushing basketball media forward." },
              { icon: Users, title: "Connection", desc: "Bridging players, scouts & coaches." },
            ].map((v, i) => (
              <motion.div
                key={v.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center hover:border-primary/30 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <v.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-display text-xl tracking-wide mb-2">{v.title}</h3>
                <p className="text-white/40 text-sm">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fade}
        >
          <h2 className="font-display text-3xl md:text-4xl tracking-wider mb-4">
            READY TO <span className="text-primary">JOIN?</span>
          </h2>
          <p className="text-white/50 mb-8">Be part of the next generation of basketball media.</p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </motion.div>
      </section>

      <WebsiteFooter />
    </div>
  );
};

export default WebsiteAbout;
