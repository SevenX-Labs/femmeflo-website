"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Heart, Leaf } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Background Particles (hearts and leaves)
function BackgroundParticles() {
  const particles = [
    { type: "heart", top: "15%", left: "12%", size: 18, delay: 0, duration: 7 },
    { type: "heart", top: "45%", left: "80%", size: 22, delay: 2, duration: 8 },
    { type: "heart", top: "75%", left: "20%", size: 16, delay: 1, duration: 6.5 },
    { type: "heart", top: "25%", left: "70%", size: 30, delay: 3, duration: 9 },
    { type: "leaf", top: "20%", left: "85%", size: 22, delay: 0.5, duration: 7.5 },
    { type: "leaf", top: "60%", left: "10%", size: 24, delay: 2.5, duration: 8.5 },
    { type: "leaf", top: "80%", left: "75%", size: 20, delay: 1.5, duration: 7 },
    { type: "leaf", top: "10%", left: "40%", size: 18, delay: 3.5, duration: 9.5 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p, index) => (
        <motion.div
          key={index}
          className="absolute opacity-45 select-none"
          style={{ top: p.top, left: p.left }}
          animate={{
            y: [-10, 15, -10],
            x: [-8, 8, -8],
            rotate: [-12, 12, -12],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        >
          {p.type === "heart" ? (
            <Heart size={p.size} className="text-[#E61C5D] fill-[#E61C5D] drop-shadow-sm" />
          ) : (
            <Leaf size={p.size} className="text-[#156035] fill-[#156035] drop-shadow-sm" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function FloatingProduct() {
  const gsapWrapperRef = useRef<HTMLDivElement>(null);

  // Motion values for smooth cursor tracking
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const mouseX = useSpring(rawMouseX, { stiffness: 60, damping: 18 });
  const mouseY = useSpring(rawMouseY, { stiffness: 60, damping: 18 });

  // Handle subtle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const normX = (e.clientX / innerWidth - 0.5) * 2;
      const normY = (e.clientY / innerHeight - 0.5) * 2;
      rawMouseX.set(normX * 20);
      rawMouseY.set(normY * 15);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [rawMouseX, rawMouseY]);

  // GSAP ScrollTrigger to move product smoothly from Hero right-side to About left-side
  useEffect(() => {
    const wrapper = gsapWrapperRef.current;
    if (!wrapper) return;

    const ctx = gsap.context(() => {
      const getDeltas = () => {
        const heroAnchor = document.getElementById("hero-product-anchor");
        const aboutAnchor = document.getElementById("about-product-anchor");

        if (!heroAnchor || !aboutAnchor) {
          return { deltaX: -550, deltaY: 700 };
        }

        const heroRect = heroAnchor.getBoundingClientRect();
        const aboutRect = aboutAnchor.getBoundingClientRect();

        const heroTop = heroRect.top + window.scrollY;
        const heroLeft = heroRect.left + window.scrollX;
        const aboutTop = aboutRect.top + window.scrollY;
        const aboutLeft = aboutRect.left + window.scrollX;

        const deltaX = aboutLeft - heroLeft + (aboutRect.width - heroRect.width) / 2;
        const deltaY = aboutTop - heroTop + (aboutRect.height - heroRect.height) / 2;

        return { deltaX, deltaY };
      };

      gsap.to(wrapper, {
        scrollTrigger: {
          trigger: "#hero",
          endTrigger: "#about",
          start: "top top",
          end: "center center",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
        x: () => getDeltas().deltaX,
        y: () => getDeltas().deltaY,
        scale: 0.9,
        rotationZ: -8,
        rotationY: 15,
        ease: "power1.inOut",
      });
    }, gsapWrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-full flex items-center justify-center select-none pointer-events-none">
      {/* Background Orbs */}
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full bg-[#E61C5D]/25 blur-3xl pointer-events-none z-0"
        style={{ top: "45%", left: "50%", transform: "translate(-50%, -50%)" }}
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.22, 0.28, 0.22],
          x: [-15, 15, -15],
          y: [-10, 10, -10],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-[380px] h-[380px] rounded-full bg-[#156035]/18 blur-3xl pointer-events-none z-0"
        style={{ top: "35%", left: "45%", transform: "translate(-50%, -50%)" }}
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.15, 0.22, 0.15],
          x: [12, -12, 12],
          y: [12, -12, 12],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating Particles */}
      <BackgroundParticles />

      {/* GSAP Scroll Target Container */}
      <div ref={gsapWrapperRef} className="relative z-20 w-full flex items-center justify-center">
        {/* Framer Motion Continuous Floating Loop (Y: -12px to +12px, Rotate: -2° to +2°, 5.5s infinite) */}
        <motion.div
          className="relative w-full max-w-[550px] lg:max-w-[620px]"
          style={{
            x: mouseX,
            y: mouseY,
          }}
          animate={{
            y: [-12, 12, -12],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Realistic Drop Shadow + Product Image */}
          <div
            className="relative w-full h-auto flex justify-center items-center"
            style={{
              filter: "drop-shadow(0 45px 55px rgba(0,0,0,0.18))",
            }}
          >
            <Image
              src="/femmeflo-product-nobg.png"
              alt="Femmeflo XL Sanitary Pads"
              width={650}
              height={650}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 40vw"
              loading="lazy"
              className="w-full h-auto object-contain pointer-events-none max-h-[500px] sm:max-h-[560px] lg:max-h-[620px]"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
