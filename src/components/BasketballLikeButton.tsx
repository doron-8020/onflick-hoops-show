import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface BasketballLikeButtonProps {
  liked: boolean;
  count: number;
  onLike: () => void;
}

const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

const BasketballLikeButton = ({ liked, count, onLike }: BasketballLikeButtonProps) => {
  const [justLiked, setJustLiked] = useState(false);

  const handleClick = () => {
    if (!liked) setJustLiked(true);
    onLike();
  };

  useEffect(() => {
    if (justLiked) {
      const timer = setTimeout(() => setJustLiked(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [justLiked]);

  return (
    <button onClick={handleClick} className="flex flex-col items-center gap-1">
      <motion.div
        whileTap={{ scale: 1.3 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className="relative h-12 w-12"
      >
        {/* Basketball SVG */}
        <motion.svg
          viewBox="0 0 100 100"
          className="h-full w-full drop-shadow-lg"
          animate={{
            rotate: justLiked ? [0, 360, 720] : [0, 360],
          }}
          transition={{
            rotate: {
              duration: justLiked ? 1 : 8,
              ease: justLiked ? "easeOut" : "linear",
              repeat: justLiked ? 0 : Infinity,
            },
          }}
        >
          {/* Ball body */}
          <circle cx="50" cy="50" r="46" fill={liked ? "hsl(25, 95%, 53%)" : "hsl(25, 30%, 35%)"} />
          {/* Darker shade for 3D feel */}
          <circle cx="50" cy="50" r="46" fill="url(#ballGradient)" />
          {/* Lines */}
          <path d="M50 4 Q50 50 50 96" stroke="hsl(0,0%,10%)" strokeWidth="1.8" fill="none" opacity="0.5" />
          <path d="M4 50 Q50 50 96 50" stroke="hsl(0,0%,10%)" strokeWidth="1.8" fill="none" opacity="0.5" />
          <path d="M15 15 Q50 35 85 15" stroke="hsl(0,0%,10%)" strokeWidth="1.5" fill="none" opacity="0.4" />
          <path d="M15 85 Q50 65 85 85" stroke="hsl(0,0%,10%)" strokeWidth="1.5" fill="none" opacity="0.4" />
          {/* Texture dots */}
          <circle cx="30" cy="30" r="1" fill="hsl(0,0%,0%)" opacity="0.15" />
          <circle cx="70" cy="30" r="1" fill="hsl(0,0%,0%)" opacity="0.15" />
          <circle cx="30" cy="70" r="1" fill="hsl(0,0%,0%)" opacity="0.15" />
          <circle cx="70" cy="70" r="1" fill="hsl(0,0%,0%)" opacity="0.15" />
          <defs>
            <radialGradient id="ballGradient" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="hsla(30, 100%, 70%, 0.4)" />
              <stop offset="60%" stopColor="hsla(25, 90%, 50%, 0)" />
              <stop offset="100%" stopColor="hsla(20, 80%, 25%, 0.3)" />
            </radialGradient>
          </defs>
        </motion.svg>

        {/* Glow when liked */}
        {liked && (
          <div className="absolute inset-0 rounded-full bg-[hsl(25,95%,53%)] opacity-20 blur-md -z-10" />
        )}
      </motion.div>
      <span className="text-xs font-semibold text-foreground drop-shadow-md">{formatNumber(count)}</span>
    </button>
  );
};

export default BasketballLikeButton;
