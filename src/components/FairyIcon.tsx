"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export function FairyIcon({ className = "w-22 h-22 sm:w-30 sm:h-30" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Main Levitating Fairy Container */}
      <motion.div
        className="w-full h-full relative z-10 flex items-center justify-center scale-[1.08] transform-gpu"
        animate={{
          y: [-6, 6, -6],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Fairy Composition Box (800x800 coordinate scale) */}
        <div
          className="relative w-full aspect-square"
          style={{
            filter: `
              drop-shadow(0 4px 14px rgba(234, 179, 8, 0.45))
              drop-shadow(0 2px 6px rgba(202, 138, 4, 0.35))
              brightness(1.08)
              contrast(1.06)
              saturate(1.12)
            `,
          }}
        >
          {/* ISOLATED FLUTTERING GOLDEN FAIRY WINGS */}
          <motion.div
            id="official-yellow-fairy-wings"
            className="absolute top-[8%] left-[42%] w-[54%] h-[48%] z-10 origin-[10%_52%] transform-gpu"
            style={{ willChange: "transform" }}
            animate={{
              scaleX: [1, 0.35, 1.12, 0.42, 1],
              scaleY: [1, 1.06, 0.95, 1.04, 1],
              skewY: [0, -8, 5, -6, 0],
            }}
            transition={{
              duration: 0.18, // Rapid natural fluttering (~5.5 flaps/sec)
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/fairy-wing-clean.png"
              alt="Fairy Wings"
              fill
              sizes="150px"
              priority
              className="object-contain"
            />
          </motion.div>

          {/* STATIONARY GOLDEN FAIRY BODY */}
          <div className="absolute top-[12%] left-[16%] w-[58%] h-[82%] z-20 pointer-events-none">
            <Image
              src="/fairy-body-clean.png"
              alt="Fairy Body"
              fill
              sizes="200px"
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* Floating Fairy Magic Dust Sparkle 1 */}
        <motion.div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FFE817] shadow-[0_0_12px_#FFE817]"
          animate={{
            scale: [0.5, 1.4, 0.5],
            opacity: [0.3, 1, 0.3],
            y: [0, -8, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating Fairy Magic Dust Sparkle 2 */}
        <motion.div
          className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#FFE817] shadow-[0_0_10px_#FFE817]"
          animate={{
            scale: [1.3, 0.4, 1.3],
            opacity: [1, 0.2, 1],
            y: [0, 8, 0],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
      </motion.div>
    </div>
  );
}

export default FairyIcon;
