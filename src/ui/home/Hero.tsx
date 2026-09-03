"use client";

import { useState } from "react";
import { HERO_SCENES, ORDER_HREF } from "./heroScenes";
import { PillLink } from "@/ui/public/PageIntro";

export function Hero() {
  const [active, setActive] = useState(0);

  return (
    <section className="relative min-h-svh overflow-hidden bg-[var(--av-ink)] text-[var(--av-stage-fg)]">
      {HERO_SCENES.map((scene, i) => (
        <picture key={scene.id} className="absolute inset-0">
          <source media="(max-width: 767px)" srcSet={scene.portrait} />
          <img
            src={scene.src}
            alt=""
            width={2400}
            height={1350}
            fetchPriority={i === 0 ? "high" : "auto"}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        </picture>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col justify-end px-4 pb-16 pt-20">
        <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/80">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--av-accent)]" />
          Profilvatten med er etikett
        </p>
        <h1 className="av-serif mt-4 max-w-3xl text-5xl leading-[1.05] tracking-[-0.03em] md:text-7xl">
          Vatten som bär <em className="italic text-[var(--av-stage-accent)]">ert namn</em>.
        </h1>
        <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/80">
          Svenskt källvatten i 33 eller 50 cl PET. Du designar etiketten, vi sköter resten.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PillLink href={ORDER_HREF}>Beställ profilvatten</PillLink>
          <a
            href="#sa-funkar-det"
            className="inline-flex h-12 items-center rounded-[var(--av-radius-md)] border border-white/30 px-5 text-sm font-medium text-white"
          >
            Så funkar det
          </a>
        </div>
        <div className="mt-10 flex items-center gap-1" role="group" aria-label="Välj bildscen">
          {HERO_SCENES.map((scene, i) => (
            <button
              key={scene.id}
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className="inline-flex h-6 min-w-6 items-center justify-center"
            >
              <span
                className={`block rounded-full transition-all ${i === active ? "h-2.5 w-8 bg-white" : "h-2.5 w-2.5 bg-white/45"}`}
              />
              <span className="sr-only">{scene.caption}</span>
            </button>
          ))}
          <span className="hidden text-sm text-white/75 sm:inline">{HERO_SCENES[active]?.caption}</span>
        </div>
        <a href="#sa-funkar-det" className="av-animate-cue mt-8 inline-flex h-8 w-8 items-center justify-center text-white/70" aria-label="Scrolla till så funkar det">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </a>
      </div>
    </section>
  );
}
