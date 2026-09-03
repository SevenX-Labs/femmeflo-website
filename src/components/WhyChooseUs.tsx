"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Feather,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Users,
  Globe,
  Leaf,
  Shield,
  Sparkles
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export function WhyChooseUs() {
  return (
    <section
      id="why-choose-us"
      className="relative w-full bg-gradient-to-b from-[#FFF9F6] via-[#FDF5F7] to-[#F4FAF7] py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden font-[family-name:var(--font-jakarta)] border-b border-rose-100/50"
    >
      {/* Rich Multi-Layered Ambient Glow Orbs */}
      <div className="absolute top-10 left-[-5%] w-[650px] h-[650px] bg-gradient-to-tr from-pink-200/40 via-rose-100/30 to-amber-100/30 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-[-5%] w-[650px] h-[650px] bg-gradient-to-br from-emerald-100/50 via-teal-50/40 to-pink-100/40 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* LUXURY PAPER TEXTURE & LIGHT RAYS OVERLAY SVG */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 opacity-30">
        <svg viewBox="0 0 1000 600" fill="none" className="w-full h-full">
          <path d="M 0 0 L 1000 600 M 150 0 L 1000 500 M 0 150 L 850 600" stroke="#FCE7F3" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.6" />
        </svg>
      </div>

      {/* BOTTOM-LEFT: Full-Width Sweeping Berry Pink & Forest Green Ribbon Curves */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none select-none z-0 opacity-85 w-full h-[220px] sm:h-[300px]">
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" fill="none" className="w-full h-full">
          <path d="M -80 250 C 350 90, 850 320, 1520 120" stroke="#F0006E" strokeWidth="28" strokeLinecap="round" fill="none" />
          <path d="M -80 285 C 370 125, 870 355, 1520 155" stroke="#008228" strokeWidth="22" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* SOFT ANIMATED FLOATING ROSE PETALS */}
      <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
        <motion.div
          className="absolute top-10 left-[8%] text-pink-400 opacity-85"
          animate={{
            y: [0, 40, 80],
            x: [0, 15, -10],
            rotate: [0, 45, 90],
            opacity: [0.3, 0.9, 0.2],
          }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 30 30" fill="currentColor" className="w-7 h-7">
            <path d="M15 3 C24 10, 27 22, 15 26 C3 22, 6 10, 15 3 Z" opacity="0.85" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute top-10 right-[25%] text-pink-400 opacity-85"
          animate={{
            y: [0, 45, 90],
            x: [0, 15, -10],
            rotate: [0, 45, 90],
            opacity: [0.3, 0.9, 0.2],
          }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <svg viewBox="0 0 30 30" fill="currentColor" className="w-7 h-7">
            <path d="M15 3 C24 10, 27 22, 15 26 C3 22, 6 10, 15 3 Z" opacity="0.85" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute top-32 right-[6%] text-pink-400 opacity-85"
          animate={{
            y: [0, 55, 110],
            x: [0, -15, 10],
            rotate: [0, -45, -90],
            opacity: [0.3, 0.9, 0.2],
          }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        >
          <svg viewBox="0 0 28 28" fill="currentColor" className="w-6 h-6">
            <path d="M14 2 C22 9, 25 21, 14 25 C3 21, 6 9, 14 2 Z" opacity="0.85" />
          </svg>
        </motion.div>
      </div>

      <div className="max-w-[1320px] mx-auto flex flex-col relative z-10">
        
        {/* HEADER AREA */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-16 relative">
          
          <motion.div
            className="flex flex-col items-start max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Brand Title Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-50/90 border border-rose-200/80 text-[#9F2545] font-bold text-xs uppercase tracking-widest mb-4 shadow-2xs select-none">
              <Sparkles className="w-3.5 h-3.5 text-[#9F2545]" />
              <span>WHY CHOOSE FEMMEFLO</span>
            </div>

            {/* ScrollReveal Editorial Heading */}
            <ScrollReveal
              baseOpacity={0.2}
              enableBlur={false}
              baseRotation={2}
              containerClassName="mb-2"
              textClassName="text-3xl sm:text-5xl lg:text-[60px] font-bold tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)] leading-[1.08]"
            >
              The Femmeflo Advantage &amp; Quality Standards.
            </ScrollReveal>

            {/* Subtitle */}
            <p className="text-zinc-600 text-base lg:text-lg leading-[1.65] font-normal max-w-[520px] mt-2">
              Engineered for hospital-grade leak protection, dermatological skin safety, and uncompromised everyday value.
            </p>
          </motion.div>

          {/* TOP-RIGHT FLOATING PRODUCT PACK SHOWCASE */}
          <motion.div
            className="relative w-80 h-64 sm:w-[420px] sm:h-72 shrink-0 self-center lg:self-start pointer-events-none select-none -mt-4 lg:-mt-6"
            animate={{ y: [-8, 8, -8], rotate: [-6, -4, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/femmeflo-product-nobg.png"
              alt="FemmeFlo XXL Sanitary Pads"
              fill
              sizes="(max-width: 640px) 320px, 420px"
              loading="lazy"
              className="object-contain drop-shadow-2xl"
            />
          </motion.div>

        </div>

        {/* MAIN 45% / 55% SPLIT GRID LAYOUT WRAPPED IN SCROLL REVEAL */}
        <ScrollReveal
          baseOpacity={0.2}
          enableBlur={false}
          baseRotation={2}
          stagger={0.05}
          containerClassName="mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* LEFT 45% COLUMN: ENLARGED LIFESTYLE PHOTO + FLOATING GLASS CARD */}
            <div className="reveal-item lg:col-span-5 relative w-full aspect-[4/5] h-[520px] sm:h-[580px] lg:h-[620px] max-w-lg mx-auto lg:max-w-none rounded-[36px] overflow-hidden shadow-2xl border-2 border-white group z-10">
              {/* Lifestyle Image: /woman-pink-pajamas.webp */}
              <Image
                src="/woman-pink-pajamas.webp"
                alt="FemmeFlo Woman in Pink Silk Pajamas"
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 42vw"
                loading="lazy"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* OVERLAPPING FLOATING GLASS CARD: Cloud-Soft & Skin Friendly */}
              <motion.div
                className="absolute bottom-6 right-4 left-6 sm:left-auto sm:right-6 sm:w-[300px] bg-white/85 backdrop-blur-2xl border border-white/95 p-6 sm:p-7 rounded-2xl shadow-2xl flex flex-col gap-2.5 z-20"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/80 text-[#9F2545] flex items-center justify-center shadow-xs">
                  <Feather className="w-6 h-6" />
                </div>

                <h3 className="text-zinc-900 font-bold font-[family-name:var(--font-playfair)] text-lg sm:text-xl leading-tight">
                  Silken Touch &amp; Skin Safety
                </h3>

                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                  Hypoallergenic topsheet engineered to eliminate friction and prevent skin irritation.
                </p>

                <div className="pt-2 border-t border-rose-100/60 flex items-center gap-1.5 text-xs font-semibold text-[#9F2545]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dermatologically Certified.</span>
                </div>
              </motion.div>
            </div>

            {/* RIGHT 55% COLUMN: FEATURE BLOCKS GRID */}
            <div className="lg:col-span-7 flex flex-col gap-8 pl-0 lg:pl-2">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
                
                {/* FEATURE 1: 12-Hour Moisture Defense (Forest Green #156035) */}
                <div className="reveal-item bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-zinc-200/70 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_rgba(21,96,53,0.14)] hover:-translate-y-1.5 transition-all duration-300 flex items-start gap-4 sm:gap-5 min-h-[150px] w-full">
                  {/* Left 56px Forest Green Icon Disc */}
                  <div className="w-18 h-22 rounded-2xl bg-[#156035] text-white flex flex-col items-center justify-center shadow-md shrink-0">
                    <ShieldCheck className="w-7 h-7 mb-1" />
                    <span className="text-xs font-bold leading-none">12H</span>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-zinc-900 font-bold font-[family-name:var(--font-playfair)] text-xl sm:text-2xl leading-tight mb-2">
                      12-Hour Moisture Defense
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal mb-2.5">
                      Super-absorbent polymer matrix locks heavy fluid into dry gel instantly.
                    </p>

                    <span className="text-xs font-semibold text-[#156035]">
                      Zero Spills. Certified Safe.
                    </span>
                  </div>
                </div>

                {/* FEATURE 2: 280mm Extended Profile (Berry Pink #9F2545) */}
                <div className="reveal-item bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-zinc-200/70 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_rgba(159,37,69,0.14)] hover:-translate-y-1.5 transition-all duration-300 flex items-start gap-4 sm:gap-5 min-h-[150px] w-full">
                  {/* Left 56px Berry Pink Icon Disc */}
                  <div className="w-18 h-22 rounded-2xl bg-[#9F2545] text-white flex flex-col items-center justify-center shadow-md shrink-0">
                    <Shield className="w-7 h-7 mb-1" />
                    <span className="text-[10px] font-bold leading-none">280mm</span>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-zinc-900 font-bold font-[family-name:var(--font-playfair)] text-xl sm:text-2xl leading-tight mb-2">
                      280mm Extended Profile
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal mb-2.5">
                      Double wing anchors maintain alignment during active workdays and sleep.
                    </p>

                    <span className="text-xs font-semibold text-[#9F2545]">
                      Extra Long. Secure Fit.
                    </span>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                
                {/* FEATURE 3: Smart Choice Value (₹40 Pack) (Gold Accent) */}
                <div className="reveal-item relative bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border-2 border-amber-300 shadow-[0_15px_40px_rgba(245,158,11,0.12)] hover:shadow-[0_25px_50px_rgba(245,158,11,0.22)] hover:-translate-y-1.5 transition-all duration-300 flex items-start gap-4 sm:gap-5 min-h-[150px] w-full">
                  {/* Scalloped Best Value Badge */}
                  <div className="w-12 h-12 rounded-full bg-white border border-amber-300 text-zinc-900 font-extrabold text-[8px] uppercase tracking-wider flex items-center justify-center text-center shadow-sm absolute -top-3.5 right-4 z-10 leading-tight">
                    Best<br />Value
                  </div>

                  {/* Left 56px Golden Sphere Icon Disc */}
                  <div className="w-18 h-22 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-white flex flex-col items-center justify-center shadow-md shrink-0 relative">
                    <ShoppingBag className="w-6 h-6 mb-0.5" />
                    <span className="text-xs font-black leading-none">₹40</span>
                    <span className="text-[7px] font-bold uppercase leading-none mt-0.5">PACK</span>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-zinc-900 font-bold font-[family-name:var(--font-playfair)] text-xl sm:text-2xl leading-tight mb-1">
                      Smart Choice Value
                      <span className="block font-[family-name:var(--font-jakarta)] text-sm sm:text-base font-semibold text-amber-800 tracking-normal mt-0.5">
                        (₹40 Pack)
                      </span>
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal mb-2.5">
                      High-performance hygiene delivered at an honest price without bloated retail markups.
                    </p>

                    <span className="text-xs font-semibold text-amber-800">
                      Verified Value Standard.
                    </span>
                  </div>
                </div>

                {/* LARGER ALIGNED CTA BUTTON */}
                <div className="reveal-item flex items-center justify-start sm:justify-center pt-2">
                  <Link
                    href="#products"
                    className="bg-gradient-to-r from-[#9F2545] to-rose-600 hover:from-rose-600 hover:to-[#9F2545] text-white font-bold text-base px-9 py-4 rounded-full transition-all flex items-center gap-2.5 shadow-md hover:shadow-xl hover:scale-105 cursor-pointer"
                  >
                    <span>Explore Product Specs</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>

              </div>

            </div>

          </div>
        </ScrollReveal>

        {/* FLOATING ROUNDED GLASS TRUST BAR WRAPPED IN SCROLL REVEAL */}
        <ScrollReveal
          baseOpacity={0.2}
          enableBlur={false}
          baseRotation={1}
          containerClassName="w-full max-w-5xl mx-auto"
        >
          <div className="w-full h-[76px] sm:h-[84px] rounded-[42px] bg-white/95 backdrop-blur-2xl border border-zinc-200/80 px-8 sm:px-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex items-center justify-around gap-4 text-xs sm:text-sm font-semibold text-zinc-700">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#156035]" />
              <span>Dermatologically Tested</span>
            </div>

            <div className="hidden sm:block w-px h-5 bg-zinc-200" />

            <div className="flex items-center gap-2.5">
              <Leaf className="w-5 h-5 text-[#156035]" />
              <span>Safe &amp; Skin Friendly</span>
            </div>

            <div className="hidden sm:block w-px h-5 bg-zinc-200" />

            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-[#9F2545]" />
              <span>Trusted by Millions</span>
            </div>

            <div className="hidden sm:block w-px h-4 bg-zinc-200" />

            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-amber-600" />
              <span>Made for India</span>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}

export default WhyChooseUs;
