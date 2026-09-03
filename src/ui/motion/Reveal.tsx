"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "dash",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "public" | "dash";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const publicReveal = variant === "public";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      publicReveal
        ? { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
        : { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [publicReveal]);

  return (
    <div
      ref={ref}
      className={`av-reveal${publicReveal ? " av-reveal--public" : ""} ${className}`}
      style={delay ? ({ transitionDelay: `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
