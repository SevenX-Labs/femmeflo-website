"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Heart,
  ShieldCheck,
  Smile,
  Zap,
  ArrowRight,
  Star,
  Sparkles,
  Leaf,
  Users,
  Globe,
  ChevronRight
} from "lucide-react";

export function EssenceSection() {
  return (
    <section
      id="essence"
      className="relative w-full bg-gradient-to-b from-[#EFF9F6] via-[#F4FAF8] to-[#EAF5F2] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 overflow-hidden font-[family-name:var(--font-jakarta)]"
    >
      {/* Background Decorative Ambient Radial Glow Orbs */}
      <div className="absolute top-10 left-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-rose-100/50 blur-3xl pointer-events-none -z-10" />

      {/* FLOATING ROSE PETALS */}
      <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
        <motion.div
          className="absolute top-10 left-[8%] text-pink-400 opacity-80"
          animate={{
            y: [0, 40, 80],
            x: [0, 15, -10],
            rotate: [0, 45, 90],
            opacity: [0.3, 0.9, 0.2],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 30 30" fill="currentColor" className="w-7 h-7">
            <path d="M15 3 C24 10, 27 22, 15 26 C3 22, 6 10, 15 3 Z" opacity="0.85" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute top-20 right-[10%] text-pink-400 opacity-80"
          animate={{
            y: [0, 50, 100],
            x: [0, -15, 10],
            rotate: [0, -45, -90],
            opacity: [0.3, 0.9, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <svg viewBox="0 0 28 28" fill="currentColor" className="w-6 h-6">
            <path d="M14 2 C22 9, 25 21, 14 25 C3 21, 6 9, 14 2 Z" opacity="0.85" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-20 left-[12%] text-pink-400 opacity-70"
          animate={{
            y: [0, -40, -80],
            x: [0, 10, -10],
            rotate: [0, 30, 60],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <svg viewBox="0 0 26 26" fill="currentColor" className="w-5 h-5">
            <path d="M13 2 C20 8, 23 19, 13 23 C3 19, 6 8, 13 2 Z" opacity="0.8" />
          </svg>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section 2: ESSENCE & PERSONALITY (1:1 Reference Design Match) */}
        <motion.div
          className="w-full max-w-[1340px] bg-white border border-zinc-200/80 rounded-[40px] p-8 sm:p-14 lg:p-16 shadow-[0_30px_90px_rgba(0,0,0,0.06)] flex flex-col items-center text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Top Subtle Silk Wave Halos */}
          <div className="absolute top-0 left-0 w-[450px] h-[300px] bg-[#EAF5EE]/60 rounded-full blur-[100px] pointer-events-none -z-10" />
          <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-rose-50/70 rounded-full blur-[100px] pointer-events-none -z-10" />

          {/* CORE ESSENCE Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-white border border-zinc-200 text-[#156035] font-bold text-xs uppercase tracking-wider mb-6 shadow-2xs select-none">
            <Sparkles className="w-3.5 h-3.5 text-[#156035]" />
            <span>CORE ESSENCE</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)] mb-2 flex items-center gap-2">
            Essence <span className="text-[#E61C5D] font-normal italic font-[family-name:var(--font-playfair)]">&amp;</span> Personality
          </h2>
          <div className="w-12 h-1 bg-[#E61C5D] rounded-full mx-auto mb-8" />

          {/* Quote */}
          <motion.p
            className="text-2xl sm:text-3xl lg:text-4xl text-center max-w-4xl font-[family-name:var(--font-playfair)] text-[#156035] italic font-normal leading-relaxed mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            &ldquo;Our essence is{" "}
            <span className="text-[#E61C5D] font-bold not-italic font-sans">Period Freedom</span>
            &mdash; the ability to work, move, and live normally.&rdquo;
          </motion.p>

          <p className="text-zinc-500 text-xs sm:text-sm max-w-xl text-center mb-14 leading-relaxed font-normal">
            Guided by our motto &ldquo;Feel fresh feel free&rdquo;, we embody a personality that is warm, supportive, and alive.
          </p>

          {/* 4 PERSONALITY CARDS GRID (1:1 Reference Card Styling) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-16 text-center">
            
            {/* CARD 1: Caring (Pink Accent) */}
            <div className="relative rounded-[30px] bg-gradient-to-b from-white via-white to-rose-50/30 border border-rose-100 p-7 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgba(230,28,93,0.12)] hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between min-h-[380px] cursor-pointer overflow-hidden text-center">
              <div className="flex flex-col items-center">
                {/* 3D Glossy Double Ring Translucent Disc */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-rose-50 to-rose-100/80 border border-rose-200 text-[#E61C5D] flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                    <Heart className="w-6 h-6 fill-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-zinc-900 mb-2 group-hover:text-[#E61C5D] transition-colors">
                  Caring
                </h3>

                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-normal max-w-[220px]">
                  Gentle &amp; compassionate care for every woman.
                </p>
              </div>

              {/* Bottom Translucent Pill Button */}
              <div className="rounded-full bg-rose-50/80 border border-rose-200/80 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#E61C5D]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E61C5D] text-white flex items-center justify-center text-[10px]">
                    ♥
                  </span>
                  <span>Because you matter</span>
                </div>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* CARD 2: Confident (Green Accent) */}
            <div className="relative rounded-[30px] bg-gradient-to-b from-white via-white to-emerald-50/30 border border-emerald-100 p-7 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgba(21,96,53,0.12)] hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between min-h-[380px] cursor-pointer overflow-hidden text-center">
              <div className="flex flex-col items-center">
                {/* 3D Glossy Double Ring Translucent Disc */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-emerald-50 to-emerald-100/80 border border-emerald-200 text-[#156035] flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="w-12 h-12 rounded-full bg-[#156035] text-white flex items-center justify-center shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-zinc-900 mb-2 group-hover:text-[#156035] transition-colors">
                  Confident
                </h3>

                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-normal max-w-[220px]">
                  Dependable 24/7 security you can trust.
                </p>
              </div>

              {/* Bottom Translucent Pill Button */}
              <div className="rounded-full bg-emerald-50/80 border border-emerald-200/80 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#156035]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#156035] text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>Confidence all day</span>
                </div>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* CARD 3: Approachable (FEATURED HERO CARD - Yellow/Gold Accent) */}
            <div className="relative rounded-[30px] bg-gradient-to-b from-amber-50/60 via-white to-white border-2 border-amber-300 p-7 shadow-[0_25px_60px_rgba(245,158,11,0.18)] hover:shadow-[0_35px_70px_rgba(245,158,11,0.26)] hover:-translate-y-2 scale-[1.03] transition-all duration-300 group flex flex-col justify-between min-h-[395px] cursor-pointer overflow-hidden text-center z-10">
              {/* Top Right OUR ESSENCE Badge */}
              <div className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-[9px] uppercase tracking-wider select-none flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>OUR ESSENCE</span>
              </div>

              <div className="flex flex-col items-center">
                {/* 3D Glossy Double Ring Translucent Disc */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-amber-100 to-amber-200/80 border border-amber-300 text-amber-700 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Smile className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-zinc-900 mb-2 group-hover:text-amber-700 transition-colors">
                  Approachable
                </h3>

                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal max-w-[220px]">
                  Warm &amp; supportive voice that feels like a friend.
                </p>
              </div>

              {/* Bottom Translucent Pill Button */}
              <div className="rounded-full bg-amber-50/90 border border-amber-300/80 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-amber-900">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                    👥
                  </span>
                  <span>Always by your side</span>
                </div>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* CARD 4: Energetic (Pink/Red Accent) */}
            <div className="relative rounded-[30px] bg-gradient-to-b from-white via-white to-rose-50/30 border border-rose-100 p-7 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgba(230,28,93,0.12)] hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between min-h-[380px] cursor-pointer overflow-hidden text-center">
              <div className="flex flex-col items-center">
                {/* 3D Glossy Double Ring Translucent Disc */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-rose-50 to-rose-100/80 border border-rose-200 text-[#E61C5D] flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                    <Zap className="w-6 h-6 fill-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-zinc-900 mb-2 group-hover:text-[#E61C5D] transition-colors">
                  Energetic
                </h3>

                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-normal max-w-[220px]">
                  Empowering daily movement &amp; progress.
                </p>
              </div>

              {/* Bottom Translucent Pill Button */}
              <div className="rounded-full bg-rose-50/80 border border-rose-200/80 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#E61C5D]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E61C5D] text-white flex items-center justify-center text-[10px]">
                    ⚡
                  </span>
                  <span>Empower your day</span>
                </div>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

          </div>

          {/* BOTTOM FLOATING GLASS TRUST BAR (Exact Reference Match) */}
          <div className="w-full max-w-6xl rounded-[36px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex flex-wrap lg:flex-nowrap items-center justify-between gap-6 text-left">
            
            {/* Feature 1: Dermatologically Tested with Green Shield Badge */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#156035] text-white flex items-center justify-center shadow-md shrink-0 relative">
                <ShieldCheck className="w-8 h-8" />
                {/* Tiny Floral accent */}
                <div className="absolute -bottom-1 -right-1 text-pink-400">🌸</div>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-sm">Dermatologically Tested</h4>
                <p className="text-[11px] text-zinc-500">Safe, gentle &amp; clinically proven protection.</p>
              </div>
            </div>

            <div className="hidden lg:block w-px h-10 bg-zinc-200" />

            {/* Feature 2: Safe & Skin Friendly */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#156035] flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-sm">Safe &amp; Skin Friendly</h4>
                <p className="text-[11px] text-zinc-500">Made with skin-loving soft materials.</p>
              </div>
            </div>

            <div className="hidden lg:block w-px h-10 bg-zinc-200" />

            {/* Feature 3: Trusted by Millions */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-[#E61C5D] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-sm">Trusted by Millions</h4>
                <p className="text-[11px] text-zinc-500">Loved by women across India.</p>
              </div>
            </div>

            <div className="hidden lg:block w-px h-10 bg-zinc-200" />

            {/* Feature 4: Made for India */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-sm">Made for India</h4>
                <p className="text-[11px] text-zinc-500">Thoughtfully designed for every Indian woman.</p>
              </div>
            </div>

            {/* Right Product Showcase & CTA Button */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden sm:block relative w-20 h-12">
                <Image
                  src="/femmeflo-product-nobg.png"
                  alt="Femmeflo product"
                  fill
                  sizes="80px"
                  loading="lazy"
                  className="object-contain"
                />
              </div>
              <button className="bg-gradient-to-r from-[#E61C5D] to-rose-600 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-md hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 shrink-0">
                <span>Explore Our Promise</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </motion.div>

      </div>
    </section>
  );
}

export default EssenceSection;
