"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronDown, CircleUserRound, Menu, X, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "About Us", href: "/#about" },
  { name: "Products", href: "/#products" },
  { name: "Contact Us", href: "/contact" },
];

export function Navbar({ hideNavigation = false, userName, userDetail, dashboardHref }: { hideNavigation?: boolean; userName?: string; userDetail?: string; dashboardHref?: string }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [scrollActiveIndex, setScrollActiveIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const activeIndex = pathname === "/contact" ? 2 : scrollActiveIndex;

  useEffect(() => {
    if (pathname === "/contact") return;

    let ticking = false;

    const updateActiveNav = () => {
      ticking = false;
      const aboutEl = document.getElementById("about");
      const productsEl = document.getElementById("products");
      const scrollY = window.scrollY;

      if (productsEl && scrollY >= productsEl.offsetTop - 220) {
        setScrollActiveIndex(1);
      } else if (aboutEl && scrollY >= aboutEl.offsetTop - 220) {
        setScrollActiveIndex(0);
      } else {
        setScrollActiveIndex(null);
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateActiveNav);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateActiveNav();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <header
      className="relative w-full z-50 font-playfair bg-[url('/navbar-bg-transparent.webp')] bg-size-[100%_100%] bg-no-repeat bg-bottom pb-16 sm:pb-16 md:pb-9 lg:pb-11"
      style={{ fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, 'Times New Roman', serif" }}
    >
      <div className="w-full pt-3 sm:pt-4 lg:pt-4.5 px-4 sm:px-8 lg:px-12 relative z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* 1. Left: Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center group shrink-0 cursor-pointer">
              <Image
                src="/logo-copy.png"
                alt="Femmeflo Logo"
                width={600}
                height={200}
                quality={100}
                priority
                className="h-12 sm:h-15 lg:h-18 xl:h-20.5 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
          </div>

          {/* 2. Right: Desktop Minimal Nav Links with Playfair Display / Georgia Luxury Serif */}
          {!hideNavigation && <nav className="hidden md:flex items-center gap-7 lg:gap-9">
            <ul className="flex items-center gap-6 sm:gap-8 lg:gap-10">
              {navItems.map((item, index) => {
                const isActive = activeIndex === index;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setScrollActiveIndex(index)}
                      style={{ fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, 'Times New Roman', serif" }}
                      className={`group relative py-1.5 font-playfair text-[15px] sm:text-[16px] lg:text-[17px] font-bold tracking-[0.06em] uppercase transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "text-white drop-shadow-xs"
                          : "text-white/90 hover:text-white"
                      }`}
                    >
                      <span>{item.name}</span>
                      {isActive ? (
                        <motion.span
                          layoutId="navActiveLineWhite"
                          className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      ) : (
                        <span className="absolute bottom-0 left-0 w-0 group-hover:w-full h-[2.5px] bg-white/80 rounded-full transition-all duration-300" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>}


          {/* 3. Mobile Hamburger Button */}
          {!hideNavigation && <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>}
          {userName && <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <div className="relative"><button onClick={() => setNotificationsOpen((open) => !open)} className="relative rounded-xl p-2.5 text-white/85 hover:bg-white/10" aria-label="Open notifications" aria-expanded={notificationsOpen}><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#FDE047]" /></button>{notificationsOpen && <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-rose-100 bg-white p-4 text-left shadow-2xl"><p className="text-sm font-bold text-zinc-800">Notifications</p><p className="mt-3 rounded-xl bg-[#FFF8FA] p-3 text-xs leading-relaxed text-zinc-600">You have a new workspace update waiting.</p><button onClick={() => setNotificationsOpen(false)} className="mt-3 text-xs font-bold text-[#E61C5D]">Mark as read</button></div>}</div>
            <div className="h-8 w-px bg-white/30" />
            <div className="relative"><button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl p-1.5 text-left text-white hover:bg-white/10" aria-label="Open profile menu" aria-expanded={profileOpen}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"><CircleUserRound className="h-5 w-5" /></span><span className="hidden sm:block"><span className="block text-xs font-bold">{userName}</span><span className="block text-[11px] text-white/70">{userDetail}</span></span><ChevronDown className={`hidden h-4 w-4 text-white/70 transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`} /></button>{profileOpen && <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-rose-100 bg-white p-2 text-left shadow-2xl"><div className="border-b border-zinc-100 px-3 py-2"><p className="text-xs font-bold text-zinc-800">{userName}</p><p className="mt-1 text-[11px] text-zinc-400">{userDetail}</p></div>{dashboardHref && <Link href={dashboardHref} onClick={() => setProfileOpen(false)} className="mt-1 block rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-rose-50 hover:text-[#E61C5D]">Open workspace</Link>}{dashboardHref === "/admin" && <Link href="/admin/settings" onClick={() => setProfileOpen(false)} className="block rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-rose-50 hover:text-[#E61C5D]">Admin Settings</Link>}<Link href="/contact" onClick={() => setProfileOpen(false)} className="block rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-rose-50 hover:text-[#E61C5D]">Contact support</Link><button type="button" onClick={() => { setProfileOpen(false); logout(); window.location.href = "/"; }} className="w-full text-left block rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-rose-50 hover:text-[#E61C5D]">Sign out</button></div>}</div>
          </div>}
        </div>
      </div>

      {/* 4. Mobile Menu Overlay */}
      {!hideNavigation && <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, 'Times New Roman', serif" }}
            className="md:hidden absolute top-full left-0 right-0 z-50 bg-white/98 backdrop-blur-2xl border-b border-rose-100 px-6 py-5 shadow-2xl overflow-hidden font-playfair"
          >
            <ul className="flex flex-col gap-3">
              {navItems.map((item, index) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setScrollActiveIndex(index);
                      setMobileMenuOpen(false);
                    }}
                    style={{ fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, 'Times New Roman', serif" }}
                    className={`block text-base font-playfair font-bold tracking-[0.06em] uppercase py-1.5 cursor-pointer ${
                      activeIndex === index
                        ? "text-[#00873A]"
                        : "text-zinc-700 hover:text-[#00873A]"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>


            <div className="mt-4 pt-3 border-t border-zinc-100 font-sans">
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 bg-[#00873A] hover:bg-[#007532] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#FDE047]" />
                <span>Contact Sales &amp; Enquiries</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>}
    </header>
  );
}

export default Navbar;