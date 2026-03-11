import { motion } from "framer-motion";
import { Play } from "lucide-react";
import FloatingNav from "@/components/website/FloatingNav";
import WebsiteFooter from "@/components/website/WebsiteFooter";

const fade = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const galleryItems = [
  { type: "video", youtubeId: "6nwz_zx5jGo", label: "ONFLICK Showreel" },
  { type: "image", url: "/blog-slam-dunk.jpg", label: "Game Day" },
  { type: "image", url: "/blog-basketball-court.jpg", label: "Open Run" },
  { type: "image", url: "/blog-training-gear.jpg", label: "Training" },
  { type: "image", url: "/blog-slam-dunk.jpg", label: "Highlights" },
  { type: "image", url: "/blog-basketball-court.jpg", label: "Community" },
];

const WebsiteGallery = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <FloatingNav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1
            className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider mb-6"
            initial="hidden"
            animate="visible"
            variants={fade}
            transition={{ duration: 0.8 }}
          >
            <span className="text-primary">GALLERY</span>
          </motion.h1>
          <motion.p
            className="text-lg text-white/60 max-w-xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fade}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Moments from the court, the community, and everything in between.
          </motion.p>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryItems.map((item, i) => (
            <motion.div
              key={i}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fade}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }}
            >
              {item.type === "video" ? (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  alt={item.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <span className="font-display text-lg tracking-wide">{item.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
};

export default WebsiteGallery;
