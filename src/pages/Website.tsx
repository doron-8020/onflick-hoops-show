import { Link } from "react-router-dom";
import { ArrowRight, Users, Camera, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import FloatingNav from "@/components/website/FloatingNav";
import VideoHero from "@/components/website/VideoHero";
import WebsiteFooter from "@/components/website/WebsiteFooter";

const fade = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const Website = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <FloatingNav />

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
        ctaText="Get Started"
        ctaLink="/auth"
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
              { icon: Camera, title: "Share Highlights", desc: "Upload your best plays and moments. Vertical or landscape — we handle every format." },
              { icon: Users, title: "Get Discovered", desc: "Scouts, coaches, and professionals browse talent daily. Put yourself on the map." },
              { icon: Trophy, title: "Build Your Brand", desc: "Create a player profile with stats, traits, and a portfolio that speaks for itself." },
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

      <WebsiteFooter />
    </div>
  );
};

export default Website;
