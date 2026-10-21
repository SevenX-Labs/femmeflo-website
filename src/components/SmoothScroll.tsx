"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SmoothScrollProps {
  children: ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const pathname = usePathname();

  useEffect(() => {
    const isDashboardOrAuthRoute =
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/manager") ||
      pathname?.startsWith("/manger") ||
      pathname?.startsWith("/seller") ||
      pathname?.startsWith("/login");

    if (isDashboardOrAuthRoute) {
      return;
    }

    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ default: Lenis }, gsapModule, scrollTriggerModule] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      const gsap = gsapModule.default;
      const { ScrollTrigger } = scrollTriggerModule;
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

      (window as unknown as { lenis: typeof lenis | null }).lenis = lenis;

      lenis.on("scroll", ScrollTrigger.update);

      const updateTicker = (time: number) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(updateTicker);
      gsap.ticker.lagSmoothing(0);

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

      cleanup = () => {
        document.removeEventListener("click", handleAnchorClick);
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("dragstart", handleDragStart);
        gsap.ticker.remove(updateTicker);
        lenis.destroy();
        (window as unknown as { lenis: typeof lenis | null }).lenis = null;
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [pathname]);

  return <>{children}</>;
}
