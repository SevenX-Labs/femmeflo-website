import Image from "next/image";
import { motion } from "framer-motion";

interface ParticleItem {
  id: string;
  type: "flower" | "pad";
  top: string;
  left: string;
  width: number;
  height: number;
  delay: number;
  duration: number;
  src: string;
  className?: string;
}

// Particle configurations with exact native aspect ratios:
// /pad.webp natural dimensions: 600x400 (aspect ratio 1.5:1)
// /flower.svg natural dimensions: 100x100 (aspect ratio 1:1)
const particles: ParticleItem[] = [
  {
    id: "flower-1",
    type: "flower",
    top: "14%",
    left: "10%",
    width: 44,
    height: 44,
    delay: 0,
    duration: 7,
    src: "/flower.svg",
    className: "opacity-40 sm:opacity-75 scale-75 sm:scale-100",
  },
  {
    id: "pad-1",
    type: "pad",
    top: "46%",
    left: "82%",
    width: 75,
    height: 50, // 75 / 1.5 = 50 (exact 3:2 aspect ratio)
    delay: 2,
    duration: 8,
    src: "/pad.webp",
    // Mobile optimization: hidden on mobile so it never crowds copy or cards
    className: "hidden sm:block opacity-85",
  },
  {
    id: "flower-2",
    type: "flower",
    top: "76%",
    left: "18%",
    width: 38,
    height: 38,
    delay: 1,
    duration: 6.5,
    src: "/flower.svg",
    className: "hidden sm:block opacity-60",
  },
  {
    id: "pad-2",
    type: "pad",
    top: "24%",
    left: "72%",
    width: 66,
    height: 44, // 66 / 1.5 = 44 (exact 3:2 aspect ratio)
    delay: 3,
    duration: 9,
    src: "/pad.webp",
    // Mobile optimization: hidden on phones & small screens
    className: "hidden md:block opacity-80",
  },
  {
    id: "flower-3",
    type: "flower",
    top: "18%",
    left: "86%",
    width: 42,
    height: 42,
    delay: 0.5,
    duration: 7.5,
    src: "/flower.svg",
    className: "opacity-35 sm:opacity-70 scale-75 sm:scale-100",
  },
];

export function BackgroundParticles() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute transform-gpu ${p.className || ""}`}
          style={{ top: p.top, left: p.left, willChange: "transform, opacity" }}
          initial={{ opacity: 0.4, y: 0, rotate: 0 }}
          animate={{
            opacity: [0.4, 0.9, 0.4],
            y: [-10, 10, -10],
            x: [-6, 6, -6],
            rotate: [-10, 10, -10],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          <Image
            src={p.src}
            alt={p.type === "pad" ? "Femmeflo Sanitary Pad Accent" : "Femmeflo Flower Accent"}
            width={p.width}
            height={p.height}
            loading="lazy"
            decoding="async"
            style={{ width: `${p.width}px`, height: "auto" }}
            className="object-contain drop-shadow-md pointer-events-none select-none"
          />
        </motion.div>
      ))}
    </div>
  );
}
