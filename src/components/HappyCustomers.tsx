"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Testimonial {
  id: number;
  avatar: string;
  badge: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    avatar: "/avatar-indian-1.webp",
    badge: "Verified Buyer",
    text: "पहले दूसरे पैड्स से रैशेस होते थे, जबसे Femmeflo लिया है तबसे 100% आराम है! ⭐",
  },
  {
    id: 2,
    avatar: "/avatar-indian-2.webp",
    badge: "Verified Buyer",
    text: "कई ब्रांड्स ट्राय किए, पर Femmeflo जैसा सॉफ्ट कम्फर्ट और सूखापन कहीं नहीं मिला! ✅",
  },
  {
    id: 3,
    avatar: "/avatar-indian-3.webp",
    badge: "Verified Buyer",
    text: "पुराने पैड्स खिसक जाते थे, Femmeflo के डबल विंग्स से दिनभर पूरी सुरक्षा मिलती है! 🛡️",
  },
  {
    id: 4,
    avatar: "/avatar-indian-4.webp",
    badge: "Verified Buyer",
    text: "Heavy flow days used to be stressful. Femmeflo XL gives me 100% leak-proof confidence! 📏",
  },
  {
    id: 5,
    avatar: "/avatar-indian-5.webp",
    badge: "Verified Buyer",
    text: "बाजार के महंगे ब्रांड्स छोड़े, Femmeflo का कॉटन फील सच में बेमिसाल है! 💧",
  },
  {
    id: 6,
    avatar: "/avatar-indian-6.webp",
    badge: "Verified Buyer",
    text: "Switched from synthetic brands to Femmeflo. Pure organic cotton softness & zero rash! 🌿",
  },
  {
    id: 7,
    avatar: "/avatar-indian-7.webp",
    badge: "Verified Buyer",
    text: "नाइट में दाग लगने की टेंशन रहती थी, Femmeflo से रातभर सुकून की नींद मिलती है! 🌙",
  },
  {
    id: 8,
    avatar: "/avatar-indian-8.webp",
    badge: "Verified Buyer",
    text: "I recommended Femmeflo to all my sisters and friends. The comfort and absorption are unmatched! ✨",
  },
  {
    id: 9,
    avatar: "/avatar-indian-9.webp",
    badge: "Verified Buyer",
    text: "पहले हर 3 घंटे में बदलना पड़ता था, Femmeflo का 12 घंटे का प्रोटेक्शन सच में बेस्ट है! 👗",
  },
  {
    id: 10,
    avatar: "/avatar-indian-10.webp",
    badge: "Verified Buyer",
    text: "सेंसिटिव स्किन के लिए इससे बेहतर कुछ नहीं, दूसरे पैड्स से बहुत ज्यादा आरामदेह! 🌸",
  },
  {
    id: 11,
    avatar: "/avatar-indian-11.webp",
    badge: "Verified Buyer",
    text: "Zero shifting during long work commutes. Pure cotton comfort that keeps me completely worry-free! 💎",
  },
  {
    id: 12,
    avatar: "/avatar-indian-12.webp",
    badge: "Verified Buyer",
    text: "एक बार Femmeflo यूज़ किया तो दूसरा कोई पसंद नहीं आएगा, बेस्ट कम्फर्ट! 🛍️",
  },
];

export function HappyCustomers() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const show = () => setVideoLoaded(true);
    if (vid.readyState >= 3) { show(); return; }
    vid.addEventListener("loadeddata", show);
    vid.addEventListener("canplay", show);
    vid.addEventListener("playing", show);
    const timer = setTimeout(show, 2000);
    return () => {
      vid.removeEventListener("loadeddata", show);
      vid.removeEventListener("canplay", show);
      vid.removeEventListener("playing", show);
      clearTimeout(timer);
    };
  }, []);

  return (
    <section  
      id="happy-customers"
      className="relative w-full bg-gradient-to-br from-[#EDF9F3] via-[#FFF3F5] to-[#EBF5FC] border-b border-rose-100/60 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 overflow-hidden font-[family-name:var(--font-jakarta)]"
    >
      {/* LUXURY TOP ANIMATED WAVY HEADER SVG */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-0 pointer-events-none select-none">
        <motion.svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-10 sm:h-12 fill-white/80 backdrop-blur-md"
          animate={{ x: [-10, 10, -10] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M0,0 L1440,0 L1440,40 C1200,95 960,10 720,50 C480,90 240,15 0,60 Z" />
        </motion.svg>
      </div>

      {/* LUXURY BOTTOM ANIMATED WAVY FOOTER SVG */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 pointer-events-none select-none rotate-180 opacity-40">
        <motion.svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-10 sm:h-12 fill-rose-100/60"
          animate={{ x: [10, -10, 10] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M0,0 L1440,0 L1440,40 C1200,95 960,10 720,50 C480,90 240,15 0,60 Z" />
        </motion.svg>
      </div>

      {/* Background Soft Glow Orbs */}
      <div className="absolute top-10 left-[-5%] w-[450px] h-[450px] bg-emerald-200/35 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-[-5%] w-[500px] h-[500px] bg-sky-200/35 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center relative z-10 space-y-2 sm:space-y-3">
        
        {/* Sub-section Header */}
        <motion.div
          className="space-y-1 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 border border-rose-300 text-[11px] font-bold text-rose-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>REAL REVIEWS &amp; EXPERIENCES</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)]">
            Loved by Women Across India
          </h3>

          <p className="text-zinc-600 text-xs sm:text-sm leading-snug font-medium max-w-md mx-auto">
            Authentic feedback from verified customers who made the switch to Femmeflo XL for 100% rash-free comfort.
          </p>
        </motion.div>

        {/* MAIN STAGE: Center Interactive Video + Left/Right Floating Avatars */}
        <div className="relative w-full flex items-center justify-center min-h-[290px] sm:min-h-[330px] my-0">
          
          {/* Background Animated Curved Ribbon Paths (Behind Center Circle) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 select-none">
            <svg viewBox="0 0 1000 360" fill="none" className="w-full h-full">
              {/* Pink Sweeping Ribbon Path */}
              <path
                d="M 50 180 C 120 220, 160 110, 220 120 C 280 130, 270 240, 200 240 C 140 240, 170 140, 260 170 C 350 200, 420 280, 500 280 C 580 280, 650 200, 740 170 C 830 140, 860 240, 800 240 C 730 240, 720 130, 780 120 C 840 110, 880 220, 950 180"
                stroke="#F8A5B0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* LEFT CLUSTER: Floating Avatars (Desktop only) */}
          <div className="hidden lg:block absolute left-0 inset-y-0 w-[28%] xl:w-[32%] z-10">
            {/* Avatar 1 */}
            <div className="absolute top-1 left-[10%] group pointer-events-auto">
              <Image loading="lazy" width={60} height={60} src="/avatar-indian-1.webp" alt="Customer Review" className="w-13 h-13 xl:w-15 xl:h-15 rounded-full object-cover shadow-md border-2 border-white animate-float-slow transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute top-full left-0 mt-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">पहले दूसरे पैड्स से रैशेस होते थे, जबसे Femmeflo लिया है तबसे 100% आराम है! ⭐</p>
              </div>
            </div>

            {/* Avatar 2 */}
            <div className="absolute top-0 left-[55%] group pointer-events-auto">
              <Image loading="lazy" width={64} height={64} src="/avatar-indian-2.webp" alt="Customer Review" className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl object-cover shadow-lg border-2 border-white animate-float-alt transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute top-full right-0 mt-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">कई ब्रांड्स ट्राय किए, पर Femmeflo जैसा सॉफ्ट कम्फर्ट और सूखापन कहीं नहीं मिला! ✅</p>
              </div>
            </div>

            {/* Avatar 3 */}
            <div className="absolute top-[38%] left-[6%] group pointer-events-auto">
              <Image loading="lazy" width={60} height={60} src="/avatar-indian-3.webp" alt="Customer Review" className="w-13 h-13 xl:w-15 xl:h-15 rounded-2xl object-cover shadow-md border-2 border-white animate-float-slow transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute bottom-full left-0 mb-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">पुराने पैड्स खिसक जाते थे, Femmeflo के डबल विंग्स से दिनभर पूरी सुरक्षा मिलती है! 🛡️</p>
              </div>
            </div>

            {/* Avatar 4 */}
            <div className="absolute top-[40%] left-[62%] group pointer-events-auto">
              <Image loading="lazy" width={64} height={64} src="/avatar-indian-4.webp" alt="Customer Review" className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl object-cover shadow-md border-2 border-white animate-float-alt transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute bottom-full right-0 mb-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">Heavy flow days used to be stressful. Femmeflo XL gives me 100% leak-proof confidence! 📏</p>
              </div>
            </div>

            {/* Avatar 5 */}
            <div className="absolute bottom-1 left-[8%] group pointer-events-auto">
              <Image loading="lazy" width={60} height={60} src="/avatar-indian-5.webp" alt="Customer Review" className="w-13 h-13 xl:w-14 xl:h-14 rounded-full object-cover shadow-sm border-2 border-white animate-float-slow transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute bottom-full left-0 mb-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">बाजार के महंगे ब्रांड्स छोड़े, Femmeflo का कॉटन फील सच में बेमिसाल है! 💧</p>
              </div>
            </div>

            {/* Avatar 6 */}
            <div className="absolute bottom-0 left-[54%] group pointer-events-auto">
              <Image loading="lazy" width={64} height={64} src="/avatar-indian-6.webp" alt="Customer Review" className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl object-cover shadow-md border-2 border-white animate-float-alt transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute bottom-full right-0 mb-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">Switched from synthetic brands to Femmeflo. Pure organic cotton softness &amp; zero rash! 🌿</p>
              </div>
            </div>
          </div>

          {/* CENTER FEATURED CUSTOMER VIDEO CARD */}
          <div className="relative z-20 flex flex-col items-center">
            
            {/* Pulsing Backlight Ring */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-rose-400/20 via-emerald-300/15 to-sky-300/20 pointer-events-none transform-gpu" />

            <div className="relative p-1 group transition-transform duration-200 hover:scale-[1.02] transform-gpu">
              {/* Main Happy Customer Video (Landscape Autoplay loop) */}
              <div className="relative overflow-hidden rounded-[1.75rem] shadow-2xl border-4 border-white/95 group-hover:border-rose-300 transition-colors bg-black/5 aspect-video w-[280px] sm:w-[360px] md:w-[400px] lg:w-[440px] xl:w-[470px] max-w-[88vw]">
                {/* Skeleton loader while video buffers */}
                {!videoLoaded && (
                  <div className="absolute inset-0 z-10 bg-gradient-to-r from-rose-50 via-white to-rose-50 animate-shimmer" />
                )}
                <video
                  ref={videoRef}
                  src="/WhatsApp Video 2026-09-03 at 5.44.40 PM.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onLoadedData={() => setVideoLoaded(true)}
                  onCanPlay={() => setVideoLoaded(true)}
                  onPlaying={() => setVideoLoaded(true)}
                  className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
            </div>
          </div>

          {/* RIGHT CLUSTER: Floating Avatars (Desktop only) */}
          <div className="hidden lg:block absolute right-0 inset-y-0 w-[28%] xl:w-[32%] z-10">
            {/* Avatar 7 */}
            <div className="absolute top-0 right-[55%] group pointer-events-auto">
              <Image loading="lazy" width={60} height={60} src="/avatar-indian-7.webp" alt="Customer Review" className="w-13 h-13 xl:w-15 xl:h-15 rounded-full object-cover shadow-md border-2 border-white animate-float-alt transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute top-full left-0 mt-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">नाइट में दाग लगने की टेंशन रहती थी, Femmeflo से रातभर सुकून की नींद मिलती है! 🌙</p>
              </div>
            </div>

            {/* Avatar 8 */}
            <div className="absolute top-1 right-[10%] group pointer-events-auto">
              <Image loading="lazy" width={64} height={64} src="/avatar-indian-8.webp" alt="Customer Review" className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl object-cover shadow-lg border-2 border-white animate-float-slow transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute top-full right-0 mt-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">I recommended Femmeflo to all my sisters and friends. The comfort and absorption are unmatched! ✨</p>
              </div>
            </div>

            {/* Avatar 9 */}
            <div className="absolute top-[38%] right-[6%] group pointer-events-auto">
              <Image loading="lazy" width={64} height={64} src="/avatar-indian-9.webp" alt="Customer Review" className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl object-cover shadow-lg border-2 border-white animate-float-slow transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute bottom-full right-0 mb-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">पहले हर 3 घंटे में बदलना पड़ता था, Femmeflo का 12 घंटे का प्रोटेक्शन सच में बेस्ट है! 👗</p>
              </div>
            </div>

            {/* Avatar 10 */}
            <div className="absolute top-[40%] right-[62%] group pointer-events-auto">
              <Image loading="lazy" width={60} height={60} src="/avatar-indian-10.webp" alt="Customer Review" className="w-13 h-13 xl:w-15 xl:h-15 rounded-2xl object-cover shadow-md border-2 border-white animate-float-alt transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute bottom-full left-0 mb-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">सेंसिटिव स्किन के लिए इससे बेहतर कुछ नहीं, दूसरे पैड्स से बहुत ज्यादा आरामदेह! 🌸</p>
              </div>
            </div>

            {/* Avatar 11 */}
            <div className="absolute bottom-0 right-[54%] group pointer-events-auto">
              <Image loading="lazy" width={60} height={60} src="/avatar-indian-11.webp" alt="Customer Review" className="w-13 h-13 xl:w-15 xl:h-15 rounded-full object-cover shadow-md border-2 border-white animate-float-alt transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute bottom-full left-0 mb-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">Zero shifting during long work commutes. Pure cotton comfort that keeps me completely worry-free! 💎</p>
              </div>
            </div>

            {/* Avatar 12 */}
            <div className="absolute bottom-1 right-[8%] group pointer-events-auto">
              <Image loading="lazy" width={60} height={60} src="/avatar-indian-12.webp" alt="Customer Review" className="w-13 h-13 xl:w-14 xl:h-14 rounded-full object-cover shadow-sm border-2 border-white animate-float-slow transform-gpu cursor-pointer transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute bottom-full right-0 mb-1.5 px-3.5 py-2 rounded-xl bg-white/98 backdrop-blur-md border border-rose-200/90 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 w-[210px] sm:w-[230px] text-left">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] text-amber-500 font-bold">★★★★★</span>
                  <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full">Verified Buyer</span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-snug">एक बार Femmeflo यूज़ किया तो दूसरा कोई पसंद नहीं आएगा, बेस्ट कम्फर्ट! 🛍️</p>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE ONLY: Running Infinite Testimonials Loop (Right to Left) */}
        <div className="block lg:hidden w-full overflow-hidden mt-4 sm:mt-6 pt-1 pb-2 relative">
          {/* Gradient edge blur masks for seamless entry and exit */}
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-14 bg-gradient-to-r from-[#EDF9F3] via-[#EDF9F3]/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-14 bg-gradient-to-l from-[#EBF5FC] via-[#EBF5FC]/80 to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex gap-3.5 w-max select-none"
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              duration: 35,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {[...testimonials, ...testimonials].map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="w-[265px] sm:w-[295px] shrink-0 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-rose-200/90 shadow-md flex items-start gap-3 text-left transition-transform duration-200"
              >
                <Image
                  src={item.avatar}
                  alt="Verified Customer Review"
                  width={44}
                  height={44}
                  loading="lazy"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-xs shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] text-amber-500 font-bold tracking-tight">★★★★★</span>
                    <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-800 font-medium leading-snug">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}

export default HappyCustomers;
