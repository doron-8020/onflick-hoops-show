import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import FloatingNav from "@/components/website/FloatingNav";
import VideoHero from "@/components/website/VideoHero";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import FloatingNav from "@/components/website/FloatingNav";
import WebsiteFooter from "@/components/website/WebsiteFooter";

const fade = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

// Generate 40 gallery items with varied content
const generateGalleryItems = () => {
  const labels = [
    "Game Day Highlights", "Crossover King", "Slam Dunk Contest", "Court Vision",
    "Fast Break", "Three Point Rain", "Block Party", "Ankle Breaker",
    "Buzzer Beater", "All-Star Weekend", "Practice Makes Perfect", "Rise & Grind",
    "Behind The Arc", "In The Paint", "Full Court Press", "Alley-Oop",
    "Pick & Roll", "Coast To Coast", "Euro Step", "Fadeaway",
    "No Look Pass", "Poster Dunk", "Step Back", "Spin Move",
    "And One", "Double Double", "Triple Threat", "Clutch Time",
    "Fourth Quarter", "Overtime Thriller", "Championship Run", "MVP Season",
    "Rookie Of The Year", "Sixth Man", "All Defense", "Most Improved",
    "Summer League", "Open Run Vibes", "Pre-Game Routine", "Post-Game Interview",
  ];

  const images = [
    "/blog-slam-dunk.jpg",
    "/blog-basketball-court.jpg",
    "/blog-training-gear.jpg",
  ];

  return labels.map((label, i) => ({
    id: i,
    label,
    image: images[i % images.length],
    aspect: i % 7 === 0 ? "tall" : i % 5 === 0 ? "wide" : "square",
  }));
};

const galleryItems = generateGalleryItems();

// Reels slider data
const reels = [
  { id: 1, title: "Insane Crossover 🔥", thumb: "/blog-slam-dunk.jpg" },
  { id: 2, title: "Game Winner!", thumb: "/blog-basketball-court.jpg" },
  { id: 3, title: "Practice Highlights", thumb: "/blog-training-gear.jpg" },
  { id: 4, title: "Dunk of the Year", thumb: "/blog-slam-dunk.jpg" },
  { id: 5, title: "Behind the Scenes", thumb: "/blog-basketball-court.jpg" },
  { id: 6, title: "Top 10 Plays", thumb: "/blog-training-gear.jpg" },
  { id: 7, title: "Ankle Breaker Mix", thumb: "/blog-slam-dunk.jpg" },
  { id: 8, title: "All-Star Warmup", thumb: "/blog-basketball-court.jpg" },
];

const ReelsSlider = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 260, behavior: "smooth" });
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  return (
    <div className="relative group">
      {/* Arrows */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scrollable reels */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-6 py-2 snap-x snap-mandatory"
      >
        {reels.map((reel) => (
          <motion.div
            key={reel.id}
            className="relative shrink-0 w-[200px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 cursor-pointer snap-start group/reel"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <img
              src={reel.thumb}
              alt={reel.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/reel:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3">
              <span className="text-white text-sm font-semibold line-clamp-2">{reel.title}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Masonry-style grid with alternating 3 and 4 columns
const GalleryGrid = () => {
  return (
    <div className="px-0">
      {/* Split items into rows alternating between 4 and 3 */}
      {(() => {
        const rows: { items: typeof galleryItems; cols: number }[] = [];
        let idx = 0;
        let rowIndex = 0;
        while (idx < galleryItems.length) {
          const cols = rowIndex % 2 === 0 ? 4 : 3;
          rows.push({ items: galleryItems.slice(idx, idx + cols), cols });
          idx += cols;
          rowIndex++;
        }
        return rows.map((row, ri) => (
          <div
            key={ri}
            className={`grid gap-1 ${
              row.cols === 4 ? "grid-cols-4" : "grid-cols-3"
            }`}
          >
            {row.items.map((item, ii) => {
              // Vary heights for visual interest
              const isFeature = ri % 3 === 0 && ii === 0;
              return (
                <motion.div
                  key={item.id}
                  className={`relative overflow-hidden cursor-pointer group ${
                    isFeature && row.cols === 4 ? "row-span-2" : ""
                  }`}
                  style={{
                    aspectRatio: isFeature && row.cols === 4 ? "1/2" : ri % 2 === 0 ? "1/1" : "4/3",
                  }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: ii * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                  <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-white text-sm font-semibold drop-shadow-lg">
                      {item.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ));
      })()}
    </div>
  );
};

const WebsiteGallery = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <FloatingNav />

      <VideoHero
        videoId="6nwz_zx5jGo"
        title={
          <>
            OUR <span className="text-primary">GALLERY</span>
          </>
        }
        subtitle="Moments from the court, the community, and everything in between."
      />

      {/* Reels Slider */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto mb-6 px-6">
          <h2 className="font-display text-2xl md:text-3xl tracking-wider">
            FEATURED <span className="text-primary">REELS</span>
          </h2>
        </div>
        <ReelsSlider />
      </section>

      {/* Full-width Gallery Grid */}
      <section className="pt-8 pb-16">
        <div className="max-w-7xl mx-auto mb-6 px-6">
          <h2 className="font-display text-2xl md:text-3xl tracking-wider">
            ALL <span className="text-primary">CONTENT</span>
          </h2>
        </div>
        <div className="max-w-[100vw]">
          <GalleryGrid />
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
};

export default WebsiteGallery;
