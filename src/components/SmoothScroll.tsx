"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface SmoothScrollProps {
  children: ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Only initialize Lenis smooth scrolling on public marketing / landing pages.
    // Dashboard, admin, manager, seller, and modal-heavy workspaces need standard native scrolling
    // so nested scroll boxes, dialogs, and tables can scroll freely with mousewheel without Lenis intercepting.
    const isDashboardOrAuthRoute =
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/manager") ||
      pathname?.startsWith("/manger") ||
      pathname?.startsWith("/seller") ||
      pathname?.startsWith("/login");

    if (isDashboardOrAuthRoute) {
      return;
    }

    // Register GSAP ScrollTrigger plugin for syncing
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0 : 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: !prefersReducedMotion,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
      prevent: (node) => {
        // Automatically allow any element with data-lenis-prevent, inside a dialog/modal,
        // or any element that has scrollable overflow to scroll natively
        if (!node || !(node instanceof HTMLElement)) return false;
        if (
          node.hasAttribute("data-lenis-prevent") ||
          node.closest("[data-lenis-prevent]") ||
          node.getAttribute("role") === "dialog" ||
          node.closest('[role="dialog"]')
        ) {
          return true;
        }
        return false;
      },
    });

    (window as unknown as { lenis: Lenis | null }).lenis = lenis;

    // Sync ScrollTrigger updates with Lenis scroll
    lenis.on("scroll", ScrollTrigger.update);

    // Sync Lenis frame updates with GSAP ticker for ultra-smooth animations
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // Smooth Anchor Scrolling Interceptor for all # hash links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("#") && href.length > 1) {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            e.preventDefault();
            lenis.scrollTo(targetElement as HTMLElement, {
              offset: 70,
              duration: prefersReducedMotion ? 0 : 0.8,
            });
          }
        }
      }
    };

    // Disable right-click context menu and drag on images across website
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "IMG" || target.closest("img"))) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "IMG" || target.closest("img"))) {
        e.preventDefault();
      }
    };

    document.addEventListener("click", handleAnchorClick);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      (window as unknown as { lenis: Lenis | null }).lenis = null;
    };
  }, [pathname]);

  return <>{children}</>;
}
