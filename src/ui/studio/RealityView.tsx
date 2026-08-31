"use client";

import { useEffect, useState } from "react";

function useProgress(active: boolean) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!active) {
      if (pct > 0 && pct < 100) setPct(100);
      return;
    }
    setPct(1);
    const started = Date.now();
    const tick = window.setInterval(() => {
      const t = (Date.now() - started) / 18000;
      setPct(Math.min(94, Math.round(100 * (1 - Math.exp(-2.1 * t)))));
    }, 80);
    return () => window.clearInterval(tick);
  }, [active]);

  useEffect(() => {
    if (active || pct !== 100) return;
    const t = window.setTimeout(() => setPct(0), 500);
    return () => window.clearTimeout(t);
  }, [active, pct]);

  return active ? Math.max(pct, 1) : pct;
}

export function RealityView({
  imageUrl,
  loading,
  error,
  stale,
  onGenerate,
  onBack,
}: {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  onGenerate: () => void;
  onBack: () => void;
}) {
  const pct = useProgress(loading);
  const showBar = loading || pct > 0;

  return (
    <div className="relative flex h-full flex-col">
      {showBar ? (
        <div className="mx-4 mt-2 rounded-[var(--av-radius-lg)] bg-[var(--av-accent-soft)] px-4 py-3">
          <div className="flex items-center justify-between text-[13px] font-semibold text-[var(--av-accent)]">
            <span>Skapar bilden i verkligheten…</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[var(--av-accent)] transition-[width] duration-150 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--av-text-muted)]">Din uppladdade tryckfilen trycks på muggen. Det tar oftast 10–20 sekunder.</p>
        </div>
      ) : null}

      <div className="relative mx-auto flex min-h-0 w-full max-w-[420px] flex-1 items-center justify-center px-4 pb-2 pt-3">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Produkten i verkligheten"
            className={`max-h-full w-full rounded-[var(--av-radius-lg)] object-contain shadow-[var(--av-shadow-md)] ${loading ? "opacity-40" : ""}`}
          />
        ) : (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-[var(--av-radius-lg)] bg-[var(--av-bg)] px-6 text-center">
            <p className="text-[15px] font-semibold text-[var(--av-text)]">Se produkten i verkligheten</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--av-text-muted)]">
              Först tryckytan med din logotyp. Sedan Generera — vi startar inte förrän du klickar.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4">
        <button type="button" onClick={onBack} className="h-9 rounded-[var(--av-radius-md)] px-3 text-[13px] text-[var(--av-text-muted)] hover:bg-[var(--av-bg)]">
          ← Tillbaka till tryckytan
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="h-10 rounded-[var(--av-radius-md)] bg-[var(--av-accent)] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Skapar…" : imageUrl ? (stale ? "Uppdatera bilden" : "Generera igen") : "Generera"}
        </button>
      </div>
      {error ? <p className="px-4 pb-3 text-center text-[13px] text-red-600">{error}</p> : null}
    </div>
  );
}
