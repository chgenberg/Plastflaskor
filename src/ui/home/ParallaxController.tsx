"use client";

import { useEffect } from "react";

const TRAVEL = 8;

export function ParallaxController() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes = () => Array.from(document.querySelectorAll<HTMLElement>(".av-parallax-media"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of nodes()) {
        const r = el.getBoundingClientRect();
        const p = (vh - r.top) / (vh + r.height);
        const y = (Math.min(1, Math.max(0, p)) - 0.5) * TRAVEL;
        el.style.transform = `scale(1.2) translate3d(0, ${y.toFixed(2)}%, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
