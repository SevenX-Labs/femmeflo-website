"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, Droplets, Smile, Moon, Sparkles, Check, Star, Leaf } from "lucide-react";
import { FairyIcon } from "@/components/FairyIcon";

// 1. Full Variant Cards Collection
const allVariantProducts = [
  {
    id: "xl-protect",
    variantNumber: "01",
    name: "Femmeflo XL Protect",
    size: "280mm Extended Wear",
    badge: "Flagship Hero Product",
    badgeColor: "bg-amber-100/90 text-amber-950 border-amber-300",
    cardBg: "bg-gradient-to-b from-rose-50/80 via-white/95 to-amber-50/40",
    borderColor: "border-rose-300/90 hover:border-rose-400 ring-2 ring-rose-200/60",
    iconColor: "text-[#E61C5D] bg-rose-100/80 border-rose-200",
    mainIcon: ShieldCheck,
    statusTag: "Hero Series",
    statusBg: "bg-rose-50 text-[#E61C5D] border-rose-200/90",
    description: "Our flagship pad crafted with 12-hour dry-lock technology and cottony soft top sheet for complete day-long confidence.",
    highlights: ["12-Hour Protection Lock", "Anti-Leak Side Barriers", "Cottony Soft Gentle Sheet"],
  },
  {
    id: "xxl-overnight",
    variantNumber: "02",
    name: "Femmeflo XXL Overnight",
    size: "320mm Extra Extended Wear",
    badge: "Overnight Max Flow",
    badgeColor: "bg-purple-50 text-purple-900 border-purple-200/90",
    cardBg: "bg-gradient-to-b from-purple-50/60 via-white/90 to-purple-50/40",
    borderColor: "border-purple-200/70 hover:border-purple-300",
    iconColor: "text-purple-700 bg-purple-100/80 border-purple-200",
    mainIcon: Moon,
    statusTag: "Signature Series",
    statusBg: "bg-purple-50 text-purple-800 border-purple-200/90",
    description: "Engineered for heavy night flow, featuring 360° leak-proof coverage for restful, worry-free sleep.",
    highlights: ["14-Hour Heavy Flow Lock", "Extra-Wide Quad Wings", "Deep Instant Absorb Core"],
  },
  {
    id: "regular-active",
    variantNumber: "03",
    name: "Femmeflo Regular",
    size: "240mm Active Day Wear",
    badge: "Daily Active Comfort",
    badgeColor: "bg-emerald-50 text-emerald-900 border-emerald-200/90",
    cardBg: "bg-gradient-to-b from-emerald-50/60 via-white/90 to-emerald-50/40",
    borderColor: "border-emerald-200/70 hover:border-emerald-300",
    iconColor: "text-[#156035] bg-emerald-100/80 border-emerald-200",
    mainIcon: Leaf,
    statusTag: "Active Series",
    statusBg: "bg-emerald-50 text-[#156035] border-emerald-200/90",
    description: "Ultra-flexible, feather-light protection created for active workdays and effortless mobility.",
    highlights: ["Flexible Ergonomic Fit", "Cottony Soft Top Sheet", "Instant Dry Lock Core"],
  },
  {
    id: "overnight-max",
    variantNumber: "04",
    name: "Femmeflo Overnight Max",
    size: "350mm Extra-Long Wear",
    badge: "Max Night Coverage",
    badgeColor: "bg-blue-50 text-blue-900 border-blue-200/90",
    cardBg: "bg-gradient-to-b from-blue-50/60 via-white/90 to-indigo-50/40",
    borderColor: "border-blue-200/70 hover:border-blue-300",
    iconColor: "text-blue-700 bg-blue-100/80 border-blue-200",
    mainIcon: Star,
    statusTag: "Ultra Shield Series",
    statusBg: "bg-blue-50 text-blue-800 border-blue-200/90",
    description: "Maximum length with ultra-wide rear wings for heavy flow nights and complete uninterrupted sleep.",
    highlights: ["Ultra-Wide Rear Wings", "360° Leak Guard Contour", "Double Absorb Gel Matrix"],
  },
];

export function ProductSection() {
  return (
    <section
      id="products"
      className="relative w-full bg-gradient-to-b from-[#FDF0F5] via-[#FFF3F7] to-[#FCE8F0] border-b border-pink-200/60 px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 overflow-hidden font-[family-name:var(--font-manrope)]"
    >
      {/* Dynamic GPU-Accelerated Background Mesh Orbs */}
      <div
        className="absolute top-1/4 left-[-8%] w-[360px] sm:w-[540px] h-[360px] sm:h-[540px] bg-[#E61C5D]/15 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none -z-10 animate-pulse"
        style={{ willChange: "transform, opacity", transform: "translate3d(0, 0, 0)" }}
      />
      <div
        className="absolute bottom-12 right-[-8%] w-[360px] sm:w-[540px] h-[360px] sm:h-[540px] bg-amber-300/35 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none -z-10 animate-pulse"
        style={{ willChange: "transform, opacity", transform: "translate3d(0, 0, 0)" }}
      />
      <div
        className="absolute top-2/3 right-[15%] w-[300px] sm:w-[440px] h-[300px] sm:h-[440px] bg-emerald-300/25 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none -z-10"
        style={{ willChange: "transform, opacity", transform: "translate3d(0, 0, 0)" }}
      />

      <div className="max-w-7xl mx-auto space-y-20 sm:space-y-28">
        
        {/* MAIN HERO PRODUCT SHOWCASE (Preserving GSAP Anchor Target #product-price-anchor) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT SIDE: Product Specs, Features Grid & MRP Price Card (7 cols on lg) */}
          <motion.div
            className="lg:col-span-7 order-2 lg:order-1 flex flex-col items-start space-y-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#156035]/10 border border-[#156035]/20 text-xs font-bold text-[#156035] uppercase tracking-wider shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-[#156035]" />
              <span>Flagship Product</span>
            </div>

            {/* Heading */}
            <div className="space-y-3">
              <h2 className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)]">
                Femmeflo XL
              </h2>
              <div className="inline-block px-4 py-1.5 rounded-full bg-rose-100/80 border border-rose-200/90 text-[#E61C5D] font-semibold text-sm sm:text-base shadow-xs">
                280mm Extended Wear
              </div>
            </div>

            {/* 4 Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full pt-2">
              
              {/* Feature 1: 12-Hour Moisture Guard */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#156035] to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-[family-name:var(--font-playfair)]">
                    12-Hour Moisture Guard
                  </h3>
                  <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                    Continuous dry lock all day long.
                  </p>
                </div>
              </div>

              {/* Feature 2: Anchor Wings */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#156035] to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-[family-name:var(--font-playfair)]">
                    Anchor Wings
                  </h3>
                  <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                    Stays firmly positioned during movement.
                  </p>
                </div>
              </div>

              {/* Feature 3: Gel-Matrix Core */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#156035] to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md mt-0.5">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-[family-name:var(--font-playfair)]">
                    Gel-Matrix Core
                  </h3>
                  <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                    Polymer micro-beads trap flow instantly.
                  </p>
                </div>
              </div>

              {/* Feature 4: Silken Weave */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#156035] to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md mt-0.5">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-[family-name:var(--font-playfair)]">
                    Silken Weave
                  </h3>
                  <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                    Gentle touch designed for delicate skin.
                  </p>
                </div>
              </div>

            </div>

            {/* Price Card with Best Value Badge */}
            <div className="relative pt-4 w-full max-w-md">
              {/* Floating Pink Badge */}
              <div className="absolute top-1 right-6 z-10 bg-[#E61C5D] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md border border-white">
                Best Value
              </div>

              {/* Yellow Outline Price Container */}
              <div className="bg-white/95 backdrop-blur-md border-2 border-yellow-400 rounded-full px-7 py-4 flex items-center justify-between shadow-md">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-zinc-400 tracking-wider">M.R.P.</span>
                  <span className="text-3xl font-extrabold text-zinc-900">₹ 40</span>
                </div>

                <div className="bg-yellow-100/90 text-yellow-950 text-xs sm:text-sm font-bold px-4 py-2 rounded-full border border-yellow-300">
                  Per Pack (6 Units)
                </div>
              </div>
            </div>

          </motion.div>

          {/* RIGHT SIDE: Landing Frame for Floating Product (Circular Dual Glass Architecture) */}
          <motion.div
            className="lg:col-span-5 order-1 lg:order-2 flex items-center justify-center relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            {/* Outer Circle Glassmorphism Plate (Glass Layer 1) */}
            <div className="relative w-full max-w-[480px] sm:max-w-[520px] aspect-square rounded-full p-3 sm:p-4 bg-white/40 backdrop-blur-xl border border-white/80 shadow-[0_30px_70px_rgba(0,0,0,0.06)] flex items-center justify-center">
              {/* Ambient Backlight Glow sandwiched between glass layers */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#156035]/20 via-emerald-100/30 to-[#E61C5D]/20 blur-xl pointer-events-none -z-10" />

              {/* Inner Circle Glass Showcase Card (Glass Layer 2) */}
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-white/90 via-white/70 to-rose-50/50 backdrop-blur-2xl border-2 border-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden ring-1 ring-white/70">
                {/* Ambient Glow */}
                <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-[#E61C5D]/15 to-[#156035]/15 blur-2xl pointer-events-none" />



                {/* Floating Product Target Anchor: GSAP scroll animation on desktop + static fallback on mobile */}
                <div
                  id="product-price-anchor"
                  className="relative w-full h-full flex items-center justify-center pointer-events-none"
                >
                  {/* Product Pack Image Container (Mobile Fallback) */}
                  <div className="block lg:hidden relative w-52 h-40 sm:w-64 sm:h-48 select-none">
                    {/* Floating Animated Fairy over Product */}
                    <div className="absolute -top-6 -right-2 z-30">
                      <FairyIcon className="w-14 h-14" />
                    </div>
                    <Image
                      src="/femmeflo-product-nobg.png"
                      alt="Femmeflo XL Sanitary Pads"
                      fill
                      sizes="(max-width: 640px) 300px, (max-width: 1024px) 400px, 480px"
                      loading="lazy"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* ULTRA-PREMIUM DETAILED VARIANT CARDS GRID */}
        <div className="pt-12 sm:pt-16 border-t border-rose-200/80">
          
          {/* Sub-section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3.5 mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-rose-500/10 via-emerald-500/10 to-purple-500/10 border border-rose-200/80 text-xs font-bold text-zinc-800 uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#E61C5D]" />
              <span>Full Feminine Care Collection</span>
            </div>
            <h3 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)]">
              Tailored Solutions For Every Need
            </h3>
            <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
              Custom-crafted product lines engineered with medical-grade soft fabrics, instant absorption cores, and complete skin-safe materials.
            </p>
          </div>

          {/* 4 Authentic Detailed Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
            {allVariantProducts.map((prod, index) => {
              const MainIcon = prod.mainIcon;
              return (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  whileHover={{ y: -5 }}
                  className={`group relative rounded-3xl ${prod.cardBg} backdrop-blur-xl border ${prod.borderColor} p-6 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.07)] transition-all duration-300 flex flex-col justify-between overflow-hidden ring-1 ring-white/80 cursor-pointer`}
                >
                  <div className="space-y-5">
                    {/* Top Row: Icon + Category Pill */}
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-full ${prod.iconColor} border flex items-center justify-center shrink-0`}>
                        <MainIcon className="w-5 h-5 stroke-[2]" />
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${prod.badgeColor}`}>
                        {prod.badge}
                      </span>
                    </div>

                    {/* Title & Length Spec Pill */}
                    <div className="space-y-1.5">
                      <h4 className="text-2xl sm:text-[26px] font-black tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)]">
                        {prod.name}
                      </h4>
                      <div className="inline-block px-2.5 py-0.5 rounded-md bg-white/90 border border-zinc-200/80 text-xs font-bold text-zinc-700 shadow-2xs">
                        {prod.size}
                      </div>
                    </div>

                    {/* Short Copy */}
                    <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                      {prod.description}
                    </p>

                    {/* Feature Specs List with Custom Checks */}
                    <div className="space-y-2 pt-2 border-t border-zinc-200/40">
                      {prod.highlights.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-medium text-zinc-800">
                          <div className="w-4 h-4 rounded-full bg-emerald-100/80 text-[#156035] flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom Executive Series Status Badge */}
                  <div className="pt-5 mt-6 border-t border-zinc-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-widest">
                      Variant {prod.variantNumber}
                    </span>
                    <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border ${prod.statusBg} shadow-2xs select-none`}>
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{prod.statusTag}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}

export default ProductSection;

