"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ShieldCheck,
  Heart,
  Leaf,
  Mail,
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="w-full bg-[#05140d] text-white pt-16 pb-12 overflow-hidden font-[family-name:var(--font-jakarta)] border-t border-emerald-900/60 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-emerald-900/20 rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-rose-950/20 rounded-full blur-[140px] pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        
        {/* 1. TOP NEWSLETTER EMAIL SUBSCRIBE BANNER */}
        <div className="w-full rounded-3xl bg-gradient-to-r from-emerald-950/90 via-[#0a271a] to-emerald-950/90 border border-emerald-800/50 p-8 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-start space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>FEMMEFLO HYGIENE CLUB</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)] text-white tracking-tight">
              Subscribe For Fresh Updates &amp; Special Offers
            </h3>
            <p className="text-emerald-100/70 text-sm max-w-xl leading-relaxed">
              Join our community to receive period wellness tips, product care insights, and exclusive brand announcements directly to your inbox.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 shrink-0"
          >
            {subscribed ? (
              <div className="bg-emerald-900/80 border border-[#4ADE80]/40 text-[#4ADE80] px-6 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-[#4ADE80]" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <div className="relative w-full sm:w-[400px] flex items-center">
                <Mail className="absolute left-4 w-5 h-5 text-emerald-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  suppressHydrationWarning
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-emerald-950/90 border border-emerald-700/60 text-white placeholder-emerald-400/60 text-sm pl-11 pr-32 py-3.5 rounded-full focus:outline-none focus:border-[#E61C5D] transition-colors shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 bg-gradient-to-r from-[#E61C5D] to-rose-600 hover:from-rose-600 hover:to-[#E61C5D] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-[0_6px_20px_rgba(230,28,93,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Subscribe</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 2. SPACIOUS 4-COLUMN MAIN NAVIGATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-14 text-sm pt-4">
          
          {/* COLUMN 1: Brand & Corporate Summary (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="inline-block group cursor-pointer">
              <Image
                src="/logo-copy.png"
                alt="Femmeflo Logo"
                width={600}
                height={200}
                quality={100}
                loading="lazy"
                className="h-14 sm:h-16 lg:h-20 xl:h-22 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>

            <p className="text-emerald-100/75 text-xs sm:text-sm leading-relaxed max-w-sm">
              Femmeflo is the flagship feminine hygiene brand by{" "}
              <strong className="text-[#4ADE80] font-semibold">Masako Enterprises Private Limited</strong>, dedicated to delivering 100% leak protection, dermatologically safe materials, and cloud-soft comfort.
            </p>


          </div>

          {/* COLUMN 2: Quick Navigation (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-widest border-b border-emerald-900/80 pb-2">
              Quick Navigation
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-xs sm:text-sm text-emerald-100/75">
              <li>
                <Link href="#hero" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="#about" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>About Femmeflo</span>
                </Link>
              </li>
              <li>
                <Link href="#products" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>Products Showcase</span>
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>Product Features</span>
                </Link>
              </li>
              <li>
                <Link href="#hygiene" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>Redefining Hygiene</span>
                </Link>
              </li>
              <li>
                <Link href="#promise" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>Our Promise</span>
                </Link>
              </li>
              <li>
                <Link href="#why-choose-us" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>Why Choose Us</span>
                </Link>
              </li>
              <li>
                <Link href="#happy-customers" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>Happy Customers</span>
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>FAQ &amp; Help</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#4ADE80] transition-colors inline-flex items-center gap-1.5 group cursor-pointer">
                  <span className="text-emerald-700 group-hover:text-[#4ADE80] transition-colors">•</span>
                  <span>Contact &amp; Support</span>
                </Link>
              </li>
            </ul>

          </div>

          {/* COLUMN 3: Product Lineup (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-widest border-b border-emerald-900/80 pb-2">
              Product Lineup
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100/75">
              <li className="flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-[#FF85A1] shrink-0" />
                <span>XL Protect (280mm)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>XXL Overnight (320mm)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Femmeflo Regular</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Overnight Max</span>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: Sales & Quality Assurance (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-widest border-b border-emerald-900/80 pb-2">
              Sales &amp; Corporate Enquiries
            </h4>
            <div className="bg-emerald-950/60 border border-emerald-800/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-900/80 text-[#4ADE80] flex items-center justify-center shrink-0">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                    Official Email
                  </span>
                  <a
                    href="mailto:sales@femmeflo.in"
                    className="text-white font-bold text-xs sm:text-sm hover:text-[#4ADE80] transition-colors"
                  >
                    sales@femmeflo.in
                  </a>
                </div>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-emerald-100/70 pt-1">
              <li className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-[#FF85A1] shrink-0" />
                <span>Dermatologically Certified Standards</span>
              </li>
              <li className="flex items-center gap-2">
                <Leaf className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                <span>Chafing-Free Silken Layer</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FDE047] shrink-0" />
                <span>12-Hour Moisture Barrier Core</span>
              </li>
            </ul>
          </div>

        </div>

        {/* 3. BOTTOM COPYRIGHT & LEGAL BAR */}
        <div className="pt-8 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-200/60 gap-4">
          <p>© 2026 Femmeflo • Masako Enterprises Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="text-[#4ADE80] font-bold px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800">
              Feel fresh feel free™
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;

