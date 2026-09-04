"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FairyIcon } from "@/components/FairyIcon";
import { BackgroundParticles } from "@/components/BackgroundParticles";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function GlobalFloatingProduct() {
  const fixedContainerRef = useRef<HTMLDivElement>(null);

  // Mouse interactivity values
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const mouseX = useSpring(rawMouseX, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(rawMouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    let mouseRaf = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      if (mouseRaf) return;
      mouseRaf = requestAnimationFrame(() => {
        mouseRaf = 0;
        const { innerWidth, innerHeight } = window;
        const normX = (e.clientX / innerWidth - 0.5) * 2;
        const normY = (e.clientY / innerHeight - 0.5) * 2;
        rawMouseX.set(normX * 18);
        rawMouseY.set(normY * 12);
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (mouseRaf) cancelAnimationFrame(mouseRaf);
    };
  }, [rawMouseX, rawMouseY]);

  useEffect(() => {
    let ticking = false;
    let isInitialized = false;

    const updatePosition = () => {
      ticking = false;
      if (typeof window === "undefined") return;
      const target = fixedContainerRef.current;
      if (!target) return;

      if (window.innerWidth < 1024) {
        gsap.set(target, { opacity: 0 });
        return;
      }

      const heroAnchor = document.getElementById("hero-product-anchor");
      const aboutAnchor = document.getElementById("about-product-anchor");
      const productAnchor = document.getElementById("product-price-anchor");

      const hRect = heroAnchor ? heroAnchor.getBoundingClientRect() : null;
      const aRect = aboutAnchor ? aboutAnchor.getBoundingClientRect() : null;
      const pRect = productAnchor ? productAnchor.getBoundingClientRect() : null;

      // Ensure valid layout dimensions exist before revealing
      if (!hRect || hRect.width === 0) {
        if (!isInitialized) {
          gsap.set(target, { opacity: 0 });
          return;
        }
      }

      isInitialized = true;

      // Center positions of anchors relative to viewport with fallbacks
      const heroX = hRect && hRect.width > 0 ? hRect.left + hRect.width / 2 : window.innerWidth * 0.75;
      const heroY = hRect && hRect.height > 0 ? hRect.top + hRect.height / 2 : window.innerHeight * 0.45;

      const aboutX = aRect && aRect.width > 0 ? aRect.left + aRect.width / 2 : window.innerWidth * 0.25;
      const aboutY = aRect && aRect.height > 0 ? aRect.top + aRect.height / 2 + 10 : window.innerHeight * 0.5;

      const productX = pRect && pRect.width > 0 ? pRect.left + pRect.width / 2 : window.innerWidth * 0.75;
      const productY = pRect && pRect.height > 0 ? pRect.top + pRect.height / 2 : window.innerHeight * 0.5;

      const scrollY = window.scrollY;

      // Scroll Y thresholds
      const aboutDocY = aRect ? aRect.top + scrollY : 600;
      const aboutScrollTarget = Math.max(1, aboutDocY + (aRect ? aRect.height / 2 : 200) - window.innerHeight * 0.5);

      const productDocY = pRect ? pRect.top + scrollY : 1300;
      const productScrollTarget = Math.max(aboutScrollTarget + 100, productDocY + (pRect ? pRect.height / 2 : 200) - window.innerHeight * 0.5);

      let curX = heroX;
      let curY = heroY;
      let scale = 1;
      let rotZ = 0;
      let rotY = 0;
      let opacity = 1;

      if (pRect && scrollY > aboutScrollTarget) {
        // Stage 2: Transition from About (Left) to Product Section (Right)
        const rawP2 = Math.max(0, Math.min(1, (scrollY - aboutScrollTarget) / (productScrollTarget - aboutScrollTarget)));
        const p2 = rawP2 < 0.5 ? 2 * rawP2 * rawP2 : 1 - Math.pow(-2 * rawP2 + 2, 2) / 2;

        curX = aboutX + (productX - aboutX) * p2;
        curY = aboutY + (productY - aboutY) * p2;
        scale = 0.88 + 0.12 * p2;
        rotZ = -8 + 8 * p2;
        rotY = 15 - 15 * p2;

        // ONLY fade out when ProductSection is scrolling OFF the top of the viewport (pRect.bottom < 150)
        if (pRect.bottom < 200) {
          const fadeP = Math.max(0, Math.min(1, (200 - pRect.bottom) / 250));
          opacity = 1 - fadeP;
        }
      } else {
        // Stage 1: Transition from Hero (Right) to About (Left)
        const rawP1 = Math.max(0, Math.min(1, scrollY / aboutScrollTarget));
        const p1 = rawP1 < 0.5 ? 2 * rawP1 * rawP1 : 1 - Math.pow(-2 * rawP1 + 2, 2) / 2;

        curX = heroX + (aboutX - heroX) * p1;
        curY = heroY + (aboutY - heroY) * p1;
        scale = 1 - 0.12 * p1;
        rotZ = -8 * p1;
        rotY = 15 * p1;
      }

      // Clamp X position so the floating product box never gets cut off on screen edges
      const currentWidth = window.innerWidth >= 1280 ? 510 : window.innerWidth >= 1024 ? 470 : 400;
      const halfW = currentWidth / 2;
      curX = Math.max(halfW + 16, Math.min(window.innerWidth - halfW - 32, curX));

      // Apply 60FPS transform update
      gsap.set(target, {
        x: curX,
        y: curY,
        xPercent: -50,
        yPercent: -50,
        scale: scale,
        rotationZ: rotZ,
        rotationY: rotY,
        opacity: opacity,
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updatePosition);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updatePosition();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    // Fixed Root Layer: Below navbar (z-index: 40)
    <div
      ref={fixedContainerRef}
      className="hidden lg:flex fixed top-0 left-0 z-40 pointer-events-none select-none items-center justify-center opacity-0 transition-opacity duration-300"
      style={{ opacity: 0, willChange: "transform, opacity" }}
    >
      {/* Background Soft Glow Orbs */}
      <motion.div
        className="absolute w-[440px] h-[440px] rounded-full bg-[#E61C5D]/22 blur-3xl pointer-events-none -z-10"
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.2, 0.28, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-[390px] h-[390px] rounded-full bg-[#156035]/16 blur-3xl pointer-events-none -z-10"
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.15, 0.22, 0.15],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating Particles */}
      <BackgroundParticles />

      {/* Product Image Container */}
      <motion.div
        className="relative w-[260px] sm:w-[400px] lg:w-[470px] xl:w-[510px] flex items-center justify-center"
        style={{
          x: mouseX,
          y: mouseY,
        }}
      >
        <div
          className="relative w-full h-auto flex items-center justify-center"
          style={{
            filter: "drop-shadow(0 45px 55px rgba(0,0,0,0.18))",
          }}
        >
          {/* True Elliptical Orbit: wide on sides, tight on top/bottom */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[60]">
            <motion.div
              className="absolute"
              style={{ rotate: 0 }}
              animate={{
                x: [260, 184, 0, -184, -260, -184, 0, 184, 260],
                y: [0, 67, 95, 67, 0, -67, -95, -67, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
              }}
            >
              <FairyIcon className="w-20 h-20 sm:w-28 sm:h-28 drop-shadow-xl" />
            </motion.div>
          </div>

          <Image
            src="/femmeflo-product-nobg.png"
            alt="Femmeflo XL Sanitary Pads"
            width={800}
            height={800}
            sizes="(max-width: 640px) 300px, (max-width: 1024px) 440px, 500px"
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{ width: "100%", height: "auto" }}
            className="w-full h-auto object-contain pointer-events-none select-none max-h-[300px] sm:max-h-[440px] lg:max-h-[500px]"
          />
        </div>
      </motion.div>
    </div>
  );
}

export default GlobalFloatingProduct;
