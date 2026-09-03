"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Feather,
  Droplets,
  ShieldCheck,
  Wind,
  Layers,
  Maximize2,
  Shield,
} from "lucide-react";

interface Feature {
  id: number;
  icon: React.ElementType;
  title: string;
  tagline: string;
  description: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  accentHex: string;
  position: "left" | "right";
}

const leftFeatures: Feature[] = [
  {
    id: 1,
    icon: Feather,
    title: "Silken Surface Layer",
    tagline: "Chafing-Free Weave",
    description: "Soft texture glides smoothly against delicate skin without friction.",
    badgeBg: "bg-rose-50 border-rose-200 text-[#E61C5D]",
    textColor: "text-[#E61C5D]",
    borderColor: "border-rose-300",
    accentHex: "#E61C5D",
    position: "left",
  },
  {
    id: 2,
    icon: Droplets,
    title: "Rapid Absorb Action",
    tagline: "Polymer Micro-Beads",
    description: "Pulls heavy moisture deep into core within seconds, maintaining dry feel.",
    badgeBg: "bg-teal-50 border-teal-200 text-teal-700",
    textColor: "text-teal-700",
    borderColor: "border-teal-300",
    accentHex: "#0D9488",
    position: "left",
  },
  {
    id: 3,
    icon: ShieldCheck,
    title: "Dermat-Tested Safety",
    tagline: "Hypoallergenic Shield",
    description: "Formulated without harsh chemicals to guard against redness and irritation.",
    badgeBg: "bg-emerald-50 border-emerald-200 text-[#156035]",
    textColor: "text-[#156035]",
    borderColor: "border-emerald-300",
    accentHex: "#156035",
    position: "left",
  },
];

const rightFeatures: Feature[] = [
  {
    id: 4,
    icon: Wind,
    title: "Ventilated Airflow",
    tagline: "Micro-Porous Filter",
    description: "Breathable channel matrix allows continuous air passage to neutralize odors.",
    badgeBg: "bg-rose-50 border-rose-200 text-rose-600",
    textColor: "text-rose-600",
    borderColor: "border-rose-300",
    accentHex: "#E11D48",
    position: "right",
  },
  {
    id: 5,
    icon: Layers,
    title: "3D Gel Matrix",
    tagline: "Lock Technology",
    description: "Converts fluid into solid gel to prevent back-flow and heavy-flow staining.",
    badgeBg: "bg-sky-50 border-sky-200 text-sky-700",
    textColor: "text-sky-700",
    borderColor: "border-sky-300",
    accentHex: "#0284C7",
    position: "right",
  },
  {
    id: 6,
    icon: Maximize2,
    title: "Extended Wing Profile",
    tagline: "Extra-Long",
    description: "Wider wing geometry designed for maximum heavy-flow security.",
    badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
    textColor: "text-amber-700",
    borderColor: "border-amber-300",
    accentHex: "#D97706",
    position: "right",
  },
];

const allFeatures = [...leftFeatures, ...rightFeatures];

function LotusDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-2 sm:my-3">
      <div className="h-[1.5px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#156035]/40 to-[#156035]" />
      <svg
        viewBox="0 0 40 24"
        fill="none"
        className="w-7 h-5 text-[#156035]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 2C20 2 15 9 15 15C15 17.8 17.2 20 20 20C22.8 20 25 17.8 25 15C25 9 20 2 20 2Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M20 20C13 20 6 15 6 11C6 11 11 11 15 15C17 17 19 19 20 20Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M20 20C27 20 34 15 34 11C25 15C23 17 21 19 20 20Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <div className="h-[1.5px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-[#156035]/40 to-[#156035]" />
    </div>
  );
}

export function ProductFeaturesSection() {
  const [activeFeatureId, setActiveFeatureId] = useState<number>(1);

  const activeFeature =
    allFeatures.find((f) => f.id === activeFeatureId) || allFeatures[0];

  return (
    <section
      id="features"
      className="relative w-full py-8 sm:py-12 lg:py-14 bg-gradient-to-b from-[#FFF0F3]/70 via-[#FFF6F8] to-[#FFF0F3]/70 font-[family-name:var(--font-jakarta)] overflow-hidden min-h-0 lg:min-h-[calc(100vh-80px)] flex flex-col justify-center"
    >
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-200/25 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
        {/* ================= Compact Product Header ================= */}
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-normal text-zinc-900 font-[family-name:var(--font-playfair)] tracking-tight"
          >
            Why Femmeflo XL Stands Apart
          </motion.h2>

          <LotusDivider />

          <motion.p
            initial={{ opacity: 0, y: 5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-600 text-xs sm:text-sm leading-snug max-w-xl mx-auto"
          >
            Engineered with 6 layers of leakproof protection, 3D gel lock & hypoallergenic organic cotton.
          </motion.p>
        </div>

        {/* ================= DESKTOP LAYOUT (Fits cleanly in 1 Screen Viewport) ================= */}
        <div className="hidden lg:grid grid-cols-12 gap-6 lg:gap-8 items-center relative py-2">
          {/* SVG Connecting Lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 1200 420"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Left Top Line (Feature 1) */}
            <path
              d="M 330 65 C 410 65, 420 140, 465 160"
              stroke={activeFeatureId === 1 ? "#E61C5D" : "#E61C5D"}
              strokeWidth={activeFeatureId === 1 ? "2.5" : "1.5"}
              strokeDasharray={activeFeatureId === 1 ? "none" : "4 4"}
              opacity={activeFeatureId === 1 ? "1" : "0.3"}
              className="transition-all duration-300"
            />
            {/* Left Mid Line (Feature 2) */}
            <path
              d="M 330 210 C 410 210, 420 210, 465 210"
              stroke={activeFeatureId === 2 ? "#0D9488" : "#0D9488"}
              strokeWidth={activeFeatureId === 2 ? "2.5" : "1.5"}
              strokeDasharray={activeFeatureId === 2 ? "none" : "4 4"}
              opacity={activeFeatureId === 2 ? "1" : "0.3"}
              className="transition-all duration-300"
            />
            {/* Left Bot Line (Feature 3) */}
            <path
              d="M 330 355 C 410 355, 420 280, 465 260"
              stroke={activeFeatureId === 3 ? "#156035" : "#156035"}
              strokeWidth={activeFeatureId === 3 ? "2.5" : "1.5"}
              strokeDasharray={activeFeatureId === 3 ? "none" : "4 4"}
              opacity={activeFeatureId === 3 ? "1" : "0.3"}
              className="transition-all duration-300"
            />

            {/* Right Top Line (Feature 4) */}
            <path
              d="M 870 65 C 790 65, 780 140, 735 160"
              stroke={activeFeatureId === 4 ? "#E11D48" : "#E11D48"}
              strokeWidth={activeFeatureId === 4 ? "2.5" : "1.5"}
              strokeDasharray={activeFeatureId === 4 ? "none" : "4 4"}
              opacity={activeFeatureId === 4 ? "1" : "0.3"}
              className="transition-all duration-300"
            />
            {/* Right Mid Line (Feature 5) */}
            <path
              d="M 870 210 C 790 210, 780 210, 735 210"
              stroke={activeFeatureId === 5 ? "#0284C7" : "#0284C7"}
              strokeWidth={activeFeatureId === 5 ? "2.5" : "1.5"}
              strokeDasharray={activeFeatureId === 5 ? "none" : "4 4"}
              opacity={activeFeatureId === 5 ? "1" : "0.3"}
              className="transition-all duration-300"
            />
            {/* Right Bot Line (Feature 6) */}
            <path
              d="M 870 355 C 790 355, 780 280, 735 260"
              stroke={activeFeatureId === 6 ? "#D97706" : "#D97706"}
              strokeWidth={activeFeatureId === 6 ? "2.5" : "1.5"}
              strokeDasharray={activeFeatureId === 6 ? "none" : "4 4"}
              opacity={activeFeatureId === 6 ? "1" : "0.3"}
              className="transition-all duration-300"
            />
          </svg>

          {/* Left 3 Features */}
          <div className="col-span-4 flex flex-col gap-4 relative z-10">
            {leftFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              const isActive = activeFeatureId === feat.id;

              return (
                <motion.div
                  key={feat.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  onMouseEnter={() => setActiveFeatureId(feat.id)}
                  onClick={() => setActiveFeatureId(feat.id)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 group flex items-center text-right gap-3.5 border ${
                    isActive
                      ? "bg-white shadow-md border-rose-200 scale-[1.01]"
                      : "bg-white/70 hover:bg-white hover:shadow-xs border-transparent hover:border-rose-100"
                  }`}
                >
                  <div className="flex-1">
                    <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-rose-500/80 mb-0.5">
                      {feat.tagline}
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 font-[family-name:var(--font-playfair)] mb-0.5">
                      {feat.title}
                    </h3>
                    <p className="text-zinc-600 text-xs leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div
                    className={`w-12 h-12 shrink-0 rounded-xl ${feat.badgeBg} border flex items-center justify-center shadow-2xs transition-transform duration-300 ${
                      isActive ? "scale-105 shadow-xs" : "group-hover:scale-105"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeLeftIndicator"
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-[#E61C5D] rounded-l-full"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Center Product Card Showcase */}
          <div className="col-span-4 flex items-center justify-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-[28px] p-5 shadow-[0_20px_50px_-12px_rgba(230,28,93,0.12)] border border-rose-100 flex flex-col items-center justify-center w-full max-w-[340px] text-center relative overflow-hidden"
            >
              {/* Active Feature Live Callout Banner */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="w-full bg-gradient-to-r from-rose-50 via-teal-50/50 to-emerald-50 rounded-xl py-2 px-3 mb-3 border border-rose-100/60 flex items-center justify-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: activeFeature.accentHex }}
                  />
                  <span className="text-[11px] font-bold text-zinc-800">
                    Highlighted: <span className={activeFeature.textColor}>{activeFeature.title}</span>
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Product Showcase Image Container (Always Visible) */}
              <div
                id="features-product-anchor"
                className="w-full flex items-center justify-center p-1 mb-3 relative min-h-[180px] sm:min-h-[200px]"
              >
                <Image
                  src="/femmeflo-product-nobg.png"
                  alt="Femmeflo XL Sanitary Pad Showcase"
                  width={320}
                  height={200}
                  sizes="(max-width: 640px) 280px, 320px"
                  loading="lazy"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-auto h-auto max-h-[190px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500 select-none"
                />
              </div>

              {/* Bottom Spec Badge */}
              <div className="w-full space-y-2">
                <div className="inline-flex items-center justify-center bg-[#EBF6EF] text-[#156035] text-[11px] font-extrabold tracking-wider uppercase px-4 py-1.5 rounded-full border border-emerald-100 shadow-2xs">
                  XL • 280MM EXTRA LONG
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                  <Shield className="w-3 h-3 text-[#156035]" />
                  <span>100% Leakproof • Dermat-Tested</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right 3 Features */}
          <div className="col-span-4 flex flex-col gap-4 relative z-10">
            {rightFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              const isActive = activeFeatureId === feat.id;

              return (
                <motion.div
                  key={feat.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  onMouseEnter={() => setActiveFeatureId(feat.id)}
                  onClick={() => setActiveFeatureId(feat.id)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 group flex items-center text-left gap-3.5 border ${
                    isActive
                      ? "bg-white shadow-md border-rose-200 scale-[1.01]"
                      : "bg-white/70 hover:bg-white hover:shadow-xs border-transparent hover:border-rose-100"
                  }`}
                >
                  <div
                    className={`w-12 h-12 shrink-0 rounded-xl ${feat.badgeBg} border flex items-center justify-center shadow-2xs transition-transform duration-300 ${
                      isActive ? "scale-105 shadow-xs" : "group-hover:scale-105"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-rose-500/80 mb-0.5">
                      {feat.tagline}
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 font-[family-name:var(--font-playfair)] mb-0.5">
                      {feat.title}
                    </h3>
                    <p className="text-zinc-600 text-xs leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeRightIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-[#E61C5D] rounded-r-full"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ================= MOBILE & TABLET LAYOUT ================= */}
        <div className="flex lg:hidden flex-col gap-6 items-center">
          {/* Central Product Showcase Card */}
          <div className="w-full max-w-[340px] bg-white rounded-2xl p-5 shadow-sm border border-rose-100 flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-center p-2 mb-2">
              <Image
                src="/femmeflo-product-nobg.png"
                alt="Femmeflo XL Pad Showcase"
                width={280}
                height={170}
                sizes="280px"
                loading="lazy"
                className="w-auto max-h-[160px] object-contain drop-shadow-md"
              />
            </div>

            <div className="inline-flex items-center justify-center bg-[#EBF6EF] text-[#156035] text-xs font-extrabold tracking-wider uppercase px-4 py-1.5 rounded-full border border-emerald-100">
              XL • 280MM EXTRA LONG
            </div>
          </div>

          {/* 6 Grid Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {allFeatures.map((feat) => {
              const Icon = feat.icon;
              const isActive = activeFeatureId === feat.id;

              return (
                <div
                  key={feat.id}
                  onClick={() => setActiveFeatureId(feat.id)}
                  className={`rounded-xl p-4 border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                    isActive
                      ? "bg-white shadow-sm border-rose-300 ring-1 ring-rose-200/50"
                      : "bg-white/90 border-rose-100/80 shadow-2xs hover:bg-white"
                  }`}
                >
                  <div
                    className={`w-10 h-10 shrink-0 rounded-xl ${feat.badgeBg} border flex items-center justify-center shadow-2xs`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500/80 block mb-0.5">
                      {feat.tagline}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-900 font-[family-name:var(--font-playfair)] mb-0.5">
                      {feat.title}
                    </h3>
                    <p className="text-zinc-600 text-xs leading-snug">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductFeaturesSection;
