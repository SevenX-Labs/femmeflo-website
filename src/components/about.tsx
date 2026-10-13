"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, Feather, Clock, ShieldCheck, Sprout, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function About() {
  const mobileAboutProductRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run mobile animation on screens < 768px
    if (typeof window === "undefined" || window.innerWidth >= 768) return;
    const el = mobileAboutProductRef.current;
    if (!el) return;

    // Set initial hidden state for mobile About product
    gsap.set(el, { opacity: 0, scale: 0.9, y: 20 });

    let floatTween: gsap.core.Tween | null = null;

    // Mobile ScrollTrigger for About: start "top 60%", end "top 30%", toggleActions "play reverse play reverse"
    const ST = ScrollTrigger.create({
      trigger: "#about",
      start: "top 60%",
      end: "top 30%",
      toggleActions: "play reverse play reverse",
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            // Start gentle floating animation after fade in: translateY(-6px <-> 6px), rotate(-1.5deg <-> 1.5deg), 6s
            if (!floatTween) {
              floatTween = gsap.to(el, {
                y: 6,
                rotation: 1.5,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut",
              });
            }
          },
        });
      },
      onLeaveBack: () => {
        if (floatTween) {
          floatTween.kill();
          floatTween = null;
        }
        gsap.to(el, {
          opacity: 0,
          scale: 0.9,
          y: 20,
          duration: 0.4,
          ease: "power2.out",
        });
      },
    });

    return () => {
      if (floatTween) floatTween.kill();
      ST.kill();
    };
  }, []);

  return (
    <section
      id="about"
      className="relative w-full bg-gradient-to-b from-[#EBF7F0] via-[#E4F3EA] to-[#ECF7F1] border-b border-emerald-200/50 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-12 pb-8 sm:pb-12 lg:pb-14 scroll-mt-0 overflow-hidden font-[family-name:var(--font-jakarta)] flex flex-col justify-center"
    >
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-1/2 left-[-5%] w-[320px] sm:w-[450px] h-[320px] sm:h-[450px] bg-emerald-300/35 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-[-5%] w-[320px] sm:w-[450px] h-[320px] sm:h-[450px] bg-teal-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
        {/* Left Side: Product Landing Container (Dual Glass-behind-Glass Architecture) */}
        <motion.div
          className="relative flex items-center justify-center w-full"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Outer Glassmorphism Plate (Glass Layer 1) */}
          <div className="relative w-full max-w-[620px] p-2.5 sm:p-3.5 rounded-[2.2rem] bg-white/40 backdrop-blur-xl border border-white/80 shadow-[0_30px_70px_rgba(0,0,0,0.06)] flex items-center justify-center">
            {/* Ambient Backlight Glow sandwiched between glass layers */}
            <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-tr from-rose-200/50 via-pink-100/40 to-emerald-200/40 blur-xl pointer-events-none -z-10" />

            {/* Inner Glass Showcase Card (Glass Layer 2) */}
            <div className="relative w-full aspect-[16/11] rounded-3xl bg-gradient-to-br from-white/90 via-white/70 to-rose-50/50 backdrop-blur-2xl border-2 border-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden min-h-[250px] sm:min-h-[340px] ring-1 ring-white/70">
              {/* Animated Background Glow Circle inside About Card */}
              <motion.div
                className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-[#E61C5D]/20 to-[#00873A]/15 blur-2xl"
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 90, 0],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Anchor Target for Floating Product */}
              <div
                id="about-product-anchor"
                className="relative w-full h-full flex items-center justify-center pointer-events-none"
              >
                {/* Mobile Dedicated Floating Product inside About Card (Only visible under 768px) */}
                <div
                  ref={mobileAboutProductRef}
                  className="md:hidden relative w-[220px] h-[220px] flex items-center justify-center pointer-events-auto"
                >
                  <Image
                    src="/femmeflo-product-nobg.png"
                    alt="Femmeflo XL Sanitary Pads"
                    width={400}
                    height={400}
                    sizes="220px"
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "auto" }}
                    className="w-full h-auto object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: About Section Content */}
        <motion.div
          className="flex flex-col items-start space-y-3.5 sm:space-y-4 lg:space-y-4 font-[family-name:var(--font-jakarta)]"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF6EF] border border-[#CCE9D7] text-xs sm:text-xs font-bold text-[#00873A] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#00873A]" />
            <span>About Masako Enterprises</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-zinc-900 leading-[1.12]">
            Pioneering Premium Care,{" "}
            <span className="font-[family-name:var(--font-playfair)] italic font-semibold text-[#E61C5D]">
              Designed for Every Woman.
            </span>
          </h2>

          {/* Paragraph Copy */}
          <p className="text-zinc-600 text-xs sm:text-sm lg:text-base leading-relaxed">
            <strong className="text-zinc-900 font-semibold">Femmeflo</strong> is the flagship hygiene brand by <strong className="text-[#00873A] font-semibold">Masako Enterprises Private Limited</strong>. We combine medical-grade production standards with silken luxury, delivering accessible high-performance protection to women across India.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 w-full pt-1">
            <div className="bg-white/75 backdrop-blur-2xl border border-white/90 p-3 sm:p-3.5 rounded-2xl shadow-xs hover:shadow-md hover:bg-white/90 transition-all">
              <Feather className="w-5 h-5 text-[#E61C5D] mb-1" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900">Silken Surface</h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 leading-snug">Prevents friction during active movement.</p>
            </div>

            <div className="bg-white/75 backdrop-blur-2xl border border-white/90 p-3 sm:p-3.5 rounded-2xl shadow-xs hover:bg-white/90 transition-all">
              <Clock className="w-5 h-5 text-[#00873A] mb-1" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-1">
                <span className="font-[family-name:var(--font-playfair)] italic font-medium text-[8.5px] sm:text-[9.5px] text-[#00873A] normal-case">Up to</span>
                <span>12-Hour Defense</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 leading-snug">Instant fluid conversion for uninterrupted days.</p>
            </div>

            <div className="bg-white/75 backdrop-blur-2xl border border-white/90 p-3 sm:p-3.5 rounded-2xl shadow-xs hover:bg-white/90 transition-all">
              <ShieldCheck className="w-5 h-5 text-[#E61C5D] mb-1" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900">Double-Wing Anchor</h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 leading-snug">Contoured geometry holds firm on all sides.</p>
            </div>

            <div className="bg-white/75 backdrop-blur-2xl border border-white/90 p-3 sm:p-3.5 rounded-2xl shadow-xs hover:bg-white/90 transition-all">
              <Sprout className="w-5 h-5 text-[#00873A] mb-1" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900">Zero Additives</h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 leading-snug">Pure composition free of chlorine and synthetic dyes.</p>
            </div>
          </div>

          {/* Action CTA Link */}
          <div className="pt-2">
            <a
              href="#products"
              className="inline-flex items-center gap-2 text-[#E61C5D] font-bold text-xs sm:text-sm hover:text-[#d91b54] group transition-colors"
            >
              <span>Discover Our Innovations</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
    </section>
  );
}

export default About;
