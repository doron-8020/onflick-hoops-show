import heroImg from "@/assets/hero-basketball.jpg";
import thumb1 from "@/assets/video-thumb-1.jpg";
import thumb2 from "@/assets/video-thumb-2.jpg";
import thumb3 from "@/assets/video-thumb-3.jpg";

export interface Player {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  position: string;
  team: string;
  verified: boolean;
}

export interface VideoPost {
  id: string;
  player: Player;
  thumbnail: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  views: string;
  liked: boolean;
}

const players: Player[] = [
  { id: "1", name: "Marcus Johnson", handle: "@marcusj_hoops", avatar: "", position: "PG", team: "City Lions", verified: true },
  { id: "2", name: "DeAndre Williams", handle: "@dwill_buckets", avatar: "", position: "SF", team: "Metro Hawks", verified: true },
  { id: "3", name: "Jaylen Carter", handle: "@jcarter3", avatar: "", position: "SG", team: "Valley Kings", verified: false },
  { id: "4", name: "Tyler Brooks", handle: "@tbrooks_bball", avatar: "", position: "C", team: "Storm Elite", verified: true },
];

export const mockVideos: VideoPost[] = [
  {
    id: "1",
    player: players[0],
    thumbnail: heroImg,
    caption: "Nasty crossover 🔥 Ankle breaker season",
    tags: ["crossover", "handles", "anklebreaker"],
    likes: 14200,
    comments: 892,
    shares: 3400,
    views: "1.2M",
    liked: false,
  },
  {
    id: "2",
    player: players[1],
    thumbnail: thumb1,
    caption: "Put him on a poster 💀 No mercy in the paint",
    tags: ["dunk", "poster", "highlights"],
    likes: 28900,
    comments: 2100,
    shares: 8700,
    views: "3.5M",
    liked: true,
  },
  {
    id: "3",
    player: players[2],
    thumbnail: thumb2,
    caption: "Sunset sessions 🌅 Nothing but net from deep",
    tags: ["threepointer", "shooter", "workout"],
    likes: 7800,
    comments: 445,
    shares: 1200,
    views: "890K",
    liked: false,
  },
  {
    id: "4",
    player: players[3],
    thumbnail: thumb3,
    caption: "Late night grind 🌙 Streets don't sleep",
    tags: ["streetball", "nightgrind", "handles"],
    likes: 19500,
    comments: 1300,
    shares: 5600,
    views: "2.1M",
    liked: false,
  },
];

export const trendingTags = [
  "anklebreaker", "poster", "gameday", "handles", "dunk", 
  "threepointer", "buzzerbeater", "streetball", "workout", "highlights"
];
