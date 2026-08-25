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

  return (
    <div className="relative flex h-full flex-col px-4 pb-4 pt-2">
      <div className="relative mx-auto flex min-h-0 w-full max-w-[420px] flex-1 items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Produkten i verkligheten"
            className={`max-h-full w-full rounded-2xl object-contain shadow-[0_16px_50px_rgba(15,23,42,.12)] ${loading ? "opacity-40" : ""}`}
          />
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-[#F4F5F7]" />
        )}
        {loading || pct > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[220px] rounded-2xl bg-white/95 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,.12)]">
              <div className="flex items-center justify-between text-[12px] font-medium text-[#3B5BAA]">
                <span>Skapar bild</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E8EEFA]">
                <div className="h-full rounded-full bg-[#5B7FD4] transition-[width] duration-150 ease-out" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="h-9 rounded-full px-3 text-[13px] text-[#6b7280] hover:bg-black/[0.04]">
          ← Tillbaka till etikett
        </button>
        {stale && imageUrl && !loading ? (
          <button type="button" onClick={onGenerate} className="h-9 rounded-full bg-[#5B7FD4] px-4 text-[13px] font-semibold text-white">
            Uppdatera bilden
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-center text-[13px] text-red-600">{error}</p> : null}
    </div>
  );
}
