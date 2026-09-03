"use client";

import { useEffect, useRef, useState } from "react";
import { ORDER_HREF } from "./heroScenes";
import type { StepDef } from "./howItWorksSteps";
import { PillLink } from "@/ui/public/PageIntro";

type Mode = "static" | "mobile" | "pinned";

export function StepScrollScrub({ steps, id }: { steps: StepDef[]; id: string }) {
  const [mode, setMode] = useState<Mode>("static");
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      if (reduce.matches) setMode("static");
      else if (!wide.matches) setMode("mobile");
      else setMode("pinned");
    };
    apply();
    reduce.addEventListener("change", apply);
    wide.addEventListener("change", apply);
    return () => {
      reduce.removeEventListener("change", apply);
      wide.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    if (mode !== "pinned") return;
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(total, Math.max(0, -r.top)) / total : 0;
      setActive((c) => {
        const i = Math.min(steps.length - 1, Math.floor(p * steps.length + 1e-4));
        return c === i ? c : i;
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
  }, [mode, steps.length]);

  const list = (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const on = mode !== "pinned" || i === active;
        return (
          <li
            key={step.n}
            className={`rounded-[var(--av-radius-lg)] border p-4 ${on ? "border-[var(--av-ink)] bg-[var(--av-surface)]" : "border-[var(--av-border)] bg-[var(--av-surface)]/50"}`}
          >
            <p className="av-label">{step.n}</p>
            <h3 className="mt-1 font-semibold">{step.title}</h3>
            {on ? <p className="mt-2 text-sm leading-relaxed text-[var(--av-text-secondary)]">{step.body}</p> : null}
            {on && i === steps.length - 1 ? (
              <div className="mt-4">
                <PillLink href={ORDER_HREF}>Beställ profilvatten</PillLink>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );

  const scrubStyle = { ["--av-step-count" as string]: String(steps.length) };

  if (mode !== "pinned") {
    return (
      <section id={id} ref={sectionRef} className="av-step-scrub av-public-band py-20" style={scrubStyle}>
        <p className="av-label">Så funkar det</p>
        <h2 className="av-serif mt-3 text-4xl tracking-[-0.02em] md:text-5xl">
          Från idé till flaska. <span className="text-[var(--av-text-muted)]">Utan omvägar.</span>
        </h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="av-media aspect-[16/10]">
            <img src={steps[active]?.image ?? steps[0].image} alt={steps[active]?.alt ?? ""} className="h-full w-full object-cover" />
          </div>
          {list}
        </div>
      </section>
    );
  }

  return (
    <section id={id} ref={sectionRef} className="av-step-scrub" style={{ ...scrubStyle, height: `${steps.length * 100}svh` }}>
      <div className="sticky top-0 flex h-svh items-center">
        <div className="av-public-band grid w-full items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--av-radius-xl)] bg-[var(--av-stage)]">
            {steps.map((step, i) => (
              <img
                key={step.n}
                src={step.image}
                alt={step.alt}
                data-active={i === active ? "true" : "false"}
                className="av-stage-panel absolute inset-0 h-full w-full object-cover"
              />
            ))}
          </div>
          <div>
            <p className="av-label">Så funkar det</p>
            <h2 className="av-serif mt-3 text-4xl tracking-[-0.02em]">
              Från idé till flaska. <span className="text-[var(--av-text-muted)]">Utan omvägar.</span>
            </h2>
            <div className="mt-8">{list}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
