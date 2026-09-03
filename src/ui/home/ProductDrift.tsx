"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

type DriftProduct = {
  slug: string;
  categorySlug: string;
  name: string;
  oneLiner: string;
  image: string | null;
};

const SLOTS = [
  { top: 6, left: 1, w: 14, speed: 260, drift: -26, spin: 10, rot: -4 },
  { top: 1, left: 79, w: 15, speed: 200, drift: 30, spin: -9, rot: 4 },
  { top: 35, left: -2, w: 13, speed: 340, drift: -34, spin: 12, rot: 3 },
  { top: 30, left: 85, w: 13, speed: 400, drift: 24, spin: -12, rot: -3 },
  { top: 64, left: 2, w: 15, speed: 180, drift: 22, spin: 8, rot: 4 },
  { top: 68, left: 78, w: 14, speed: 300, drift: -28, spin: -10, rot: -4 },
];

export function ProductDrift({ products }: { products: DriftProduct[] }) {
  const picks = products.slice(0, SLOTS.length);
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const rect = section.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const c = (p - 0.5) * 2;
      cardsRef.current.forEach((el, i) => {
        if (!el) return;
        const slot = SLOTS[i];
        el.style.transform = `translate3d(${(c * slot.drift).toFixed(1)}px, ${(c * slot.speed).toFixed(1)}px, 0) rotate(${(slot.rot + c * slot.spin).toFixed(2)}deg)`;
      });
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
  }, [picks.length]);

  if (!picks.length) return null;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[var(--av-ink)] py-24 text-[var(--av-stage-fg)]">
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {picks.map((p, i) => {
          const slot = SLOTS[i];
          return (
            <Link
              key={p.slug}
              href={`/produkter/${p.categorySlug}/${p.slug}`}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className="pointer-events-auto absolute overflow-hidden rounded-[var(--av-radius-lg)] will-change-transform"
              style={{ top: `${slot.top}%`, left: `${slot.left}%`, width: `${slot.w}rem` }}
            >
              <div className="relative aspect-[4/5] bg-[var(--av-stage)]">
                {p.image ? <Image src={p.image} alt={p.name} fill className="object-cover" sizes="240px" /> : null}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="relative mx-auto max-w-xl px-4 text-center">
        <p className="av-label text-white/60">Sortimentet</p>
        <h2 className="av-serif mt-3 text-4xl tracking-[-0.02em] md:text-5xl">
          Välj flaskan. <span className="text-white/55">Resten är etikett.</span>
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          Tre profilvatten att börja med. Klicka på en flaska för storlek, kork och antal.
        </p>
        <Link
          href="/produkter"
          className="mt-8 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-[var(--av-ink)]"
        >
          Se alla produkter
        </Link>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 lg:hidden">
        {picks.map((p) => (
          <Link key={p.slug} href={`/produkter/${p.categorySlug}/${p.slug}`} className="av-card-lift overflow-hidden rounded-[var(--av-radius-lg)]">
            <div className="relative aspect-[4/5] bg-[var(--av-stage)]">
              {p.image ? <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40vw" /> : null}
            </div>
            <p className="mt-2 text-sm font-medium">{p.name}</p>
            <p className="text-[12px] text-white/60">{p.oneLiner}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
