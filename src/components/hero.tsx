"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "@/components/navbar";
import { BackgroundParticles } from "@/components/BackgroundParticles";
import { FairyIcon } from "@/components/FairyIcon";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const girlStorySlides = [
  {
    id: 1,
    image: "/hero-front.webp",
    badge: "✦ COMFORT THAT MOVES WITH YOU",
    title: "FEEL CONFIDENT.",
    subtitle: "EVERY SINGLE DAY.",
    isSplashed: true,
  },
  {
    id: 2,
    image: "/hero-front2.webp",
    badge: "✦ MADE FOR EVERYDAY",
    title: "COMFORT THAT CONNECTS US.",
    subtitle: "Comfort wherever life takes you.",
    isSplashed: false,
  },
  {
    id: 3,
    image: "/hero-front3.webp",
    badge: "✦ LIVE WITHOUT LIMITS",
    title: "MOVE FREELY.",
    subtitle: "Stay confident.",
    isSplashed: false,
  },
];

export function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const mobileProductRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Auto-advance story slides every 4.5 seconds across desktop & mobile
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % girlStorySlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        // Swipe Left -> Next Slide
        setActiveSlide((prev) => (prev + 1) % girlStorySlides.length);
      } else {
        // Swipe Right -> Previous Slide
        setActiveSlide((prev) => (prev - 1 + girlStorySlides.length) % girlStorySlides.length);
      }
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 768) return;
    const el = mobileProductRef.current;
    if (!el) return;

    const floatTween = gsap.to(el, {
      y: 8,
      rotation: 2,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    const ST = ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      toggleActions: "play reverse play reverse",
      onLeave: () => {
        gsap.to(el, {
          opacity: 0,
          scale: 0.9,
          y: 40,
          duration: 0.5,
          ease: "power2.out",
        });
      },
      onEnterBack: () => {
        gsap.to(el, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      },
    });

    return () => {
      floatTween.kill();
      ST.kill();
    };
  }, []);

  const currentStory = girlStorySlides[activeSlide];

  return (
    <section
      id="hero"
      className="relative w-full bg-gradient-to-b from-[#FFF9F7] via-[#FFFCFA] to-[#FFF5F7] font-[family-name:var(--font-jakarta)] flex flex-col justify-between overflow-hidden min-h-[calc(100vh-10px)] pb-3 sm:pb-5"
    >
      {/* 1. EXISTING NAVBAR (STAYS EXACTLY AS IS) */}
      <Navbar />

      <div className="w-full px-4 sm:px-8 lg:px-12 flex-1 flex flex-col justify-between max-w-[1440px] mx-auto relative z-10 pt-0 sm:pt-1 pb-2">
        {/* Soft Decorative Ambient Background Lighting */}
        <div className="absolute top-1/4 left-[-4%] w-[380px] h-[380px] bg-[#FFF0F4]/60 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-[2%] w-[400px] h-[400px] bg-[#F0FAF4]/50 rounded-full blur-[100px] pointer-events-none -z-10" />

        <BackgroundParticles />

        {/* MAIN COHESIVE VISUAL COMPOSITION (Zero Top Space above Left Card) */}
        <div className="w-full flex-1 flex flex-col justify-center my-auto py-0">
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center w-full min-h-[300px] sm:min-h-[380px] lg:min-h-[440px]">
            
            {/* LEFT SIDE: Animated Circular Glass Stage behind Girls Visual (Touch Swipe Enabled) */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="lg:col-span-6 relative w-full h-[360px] sm:h-[460px] lg:h-[520px] xl:h-[560px] max-h-[62vh] flex flex-col justify-between items-center lg:items-start p-2 select-none"
            >
              
              {/* Animated & Vibrating Soft Circular Glass Stage / Halo Disc with Expanding Ripple Waves */}
              <motion.div
                animate={{
                  y: [-3, 3, -3],
                  scale: [0.98, 1.02, 0.98],
                  rotate: [-1, 1, -1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[420px] lg:w-[480px] h-[300px] sm:h-[420px] lg:h-[480px] rounded-full pointer-events-none z-0 flex items-center justify-center"
              >
                {/* 1. Subtle & Delicate Soft Pink Ripple Wave Rings radiating outward */}
                <motion.div
                  animate={{
                    scale: [0.98, 1.15, 1.32],
                    opacity: [0.35, 0.12, 0],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0,
                  }}
                  className="absolute inset-0 rounded-full border border-rose-300/45 pointer-events-none"
                />
                <motion.div
                  animate={{
                    scale: [0.98, 1.15, 1.32],
                    opacity: [0.3, 0.1, 0],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1.25,
                  }}
                  className="absolute inset-0 rounded-full border border-rose-200/40 pointer-events-none"
                />
                <motion.div
                  animate={{
                    scale: [0.98, 1.15, 1.32],
                    opacity: [0.25, 0.08, 0],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 2.5,
                  }}
                  className="absolute inset-0 rounded-full border border-pink-200/35 pointer-events-none"
                />

                {/* Rotating Soft Pink Gradient Ring Glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E61C5D]/20 via-rose-100/40 to-pink-50/20 blur-xl animate-[spin_22s_linear_infinite] opacity-70" />

                {/* Outer Pink Tinted Glass Ring Border with Breathing Pulse */}
                <motion.div
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-2 rounded-full border border-rose-100/70 bg-white/45 backdrop-blur-md shadow-[0_15px_40px_rgba(230,28,93,0.06)]"
                />

                {/* Inner Pulsing Soft Pink Glass Aura Disc */}
                <div className="w-[84%] h-[84%] rounded-full bg-gradient-to-br from-white/95 via-[#FFF5F8]/70 to-rose-50/40 backdrop-blur-xl border border-rose-100/70 shadow-inner opacity-90 animate-pulse" />
              </motion.div>

              {/* Floating Upper Glass Badge (Fully Visible inside Container) */}
              <div className="relative z-30 flex justify-start w-full pt-1 pl-1 sm:pl-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStory.badge}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.35 }}
                    className="px-3.5 sm:px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-rose-100/90 shadow-xs text-[10px] sm:text-xs font-extrabold tracking-wider text-[#E61C5D] uppercase shrink-0"
                  >
                    {currentStory.badge}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Central Girls Image Container (Carousel Slide 1, 2 & 3) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-4 pb-2 z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStory.image}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                    className="w-full h-full flex items-center justify-center pointer-events-none"
                  >
                    {currentStory.isSplashed ? (
                      <Image
                        src={currentStory.image}
                        alt="Femmeflo Confident Happy Women"
                        width={720}
                        height={580}
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 45vw"
                        className="w-auto h-[102%] sm:h-[110%] lg:h-[118%] max-h-none object-contain drop-shadow-xl opacity-98 transform translate-y-0 sm:-translate-y-1 [mask-image:linear-gradient(to_bottom,black_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_88%,transparent_100%)]"
                        priority
                      />
                    ) : (
                      <div className="relative w-[270px] sm:w-[380px] lg:w-[430px] h-[270px] sm:h-[380px] lg:h-[430px] rounded-full overflow-hidden flex items-center justify-center transform -translate-y-2 sm:-translate-y-3 shadow-2xl border-4 border-white/95 bg-white/40 backdrop-blur-xs">
                        <Image
                          src={currentStory.image}
                          alt="Femmeflo Confident Happy Women"
                          width={1200}
                          height={960}
                          quality={100}
                          priority
                          sizes="(max-width: 640px) 270px, (max-width: 1024px) 380px, 430px"
                          className="w-full h-full object-cover select-none"
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Floating Lower Glass Story Text & Slider Indicators */}
              <div className="relative z-30 flex items-end justify-between w-full pb-1 pl-1 sm:pl-2 pr-1 gap-2">
                
                {/* Floating Translucent Lower Story Message */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStory.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="bg-white/90 backdrop-blur-md px-3.5 sm:px-4 py-2 rounded-2xl border border-rose-100/80 shadow-xs max-w-[210px] sm:max-w-xs"
                  >
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#156035] tracking-wider uppercase font-[family-name:var(--font-outfit)] leading-tight">
                      {currentStory.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs font-semibold text-[#E61C5D] tracking-wide font-[family-name:var(--font-playfair)] italic mt-0.5">
                      {currentStory.subtitle}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Minimal Interactive 3-Slide Indicators (● ○ ○) */}
                <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-rose-100/70 shadow-xs">
                  {girlStorySlides.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSlide(idx)}
                      className={`transition-all cursor-pointer rounded-full ${
                        activeSlide === idx
                          ? "w-2.5 h-2.5 bg-[#E61C5D] scale-110"
                          : "w-2 h-2 bg-rose-200 hover:bg-rose-300"
                      }`}
                      title={`Go to slide ${s.id}`}
                    />
                  ))}
                </div>

              </div>

            </div>

            {/* RIGHT SIDE: Brand Headline & Product Stage (~ 50% Visual Ratio) */}
            <div className="lg:col-span-6 relative w-full h-[360px] sm:h-[460px] lg:h-[520px] xl:h-[560px] max-h-[62vh] flex flex-col justify-between items-center lg:items-end lg:pr-2">
              
              {/* Brand Text Block (Pink & Green Combo with Curvy Font Accent) */}
              <div className="w-full text-center lg:text-right py-0 px-2 z-20 flex flex-col items-center lg:items-end">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[40px] font-black tracking-tight leading-none drop-shadow-2xs flex flex-wrap items-center justify-center lg:justify-end gap-x-2 sm:gap-x-3">
                  <span className="text-[#156035] uppercase font-[family-name:var(--font-outfit)]">FEEL FRESH.</span>
                  <span className="text-[#E61C5D] font-[family-name:var(--font-playfair)] italic capitalize font-extrabold tracking-normal">Feel Free.</span>
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-zinc-700 font-[family-name:var(--font-playfair)] italic tracking-wide mt-1.5 flex items-center gap-2">
                  <span className="text-[#156035]">Comfort.</span>
                  <span className="text-[#E61C5D]">Confidence.</span>
                  <span className="text-[#156035]">Freedom.</span>
                </p>
              </div>

              {/* Soft Translucent Backdrop Stage Glow behind Product */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[420px] lg:w-[480px] h-[320px] sm:h-[420px] lg:h-[480px] rounded-full bg-gradient-to-tr from-emerald-100/35 via-rose-100/40 to-transparent blur-3xl pointer-events-none -z-10" />

              {/* 3D Floating Product Box Target Anchor */}
              <div
                id="hero-product-anchor"
                className="relative w-full flex-1 flex items-center justify-center pointer-events-none"
              >
                {/* Desktop Target Anchor Placeholder for GSAP */}
                <div className="hidden lg:flex flex-col items-center justify-center opacity-0 pointer-events-none select-none">
                  <div className="w-60 h-40" />
                </div>

                {/* Mobile / Tablet Dedicated Hero Product Showcase */}
                <motion.div
                  animate={{
                    y: [-5, 5, -5],
                    rotate: [-1, 1, -1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex lg:hidden relative w-[240px] sm:w-[320px] h-[190px] sm:h-[240px] items-center justify-center pointer-events-auto select-none"
                >
                  {/* Floating Animated Fairy over Product */}
                  <div className="absolute -top-5 -right-1 sm:-top-7 sm:-right-3 z-30 pointer-events-none">
                    <FairyIcon className="w-14 h-14 sm:w-18 sm:h-18" />
                  </div>

                  <Image
                    src="/femmeflo-product-nobg.png"
                    alt="Femmeflo XL Sanitary Pads"
                    fill
                    sizes="(max-width: 640px) 260px, 340px"
                    priority
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.15)]"
                  />
                </motion.div>
              </div>

              {/* Subtle Decorative Accent Flower */}
              <div className="absolute right-0 top-12 z-30 pointer-events-none hidden sm:block">
                <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs border border-rose-100/60 shadow-2xs flex items-center justify-center p-1.5 opacity-75">
                  <Image
                    src="/flower.svg"
                    alt="Femmeflo Brand Accent"
                    width={20}
                    height={20}
                    sizes="20px"
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;