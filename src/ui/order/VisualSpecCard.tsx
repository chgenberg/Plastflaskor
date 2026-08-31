import Image from "next/image";
import type { VisualSpec } from "@/domain/visualSpec";

function SpecLine({ children, strong }: { children: string; strong?: boolean }) {
  return (
    <p className={`uppercase tracking-[0.06em] ${strong ? "text-[15px] font-semibold text-[var(--av-text)]" : "text-[13px] font-medium text-[var(--av-text-secondary)]"}`}>
      {children}
    </p>
  );
}

export function VisualSpecCard({ spec, compact, dense, hero }: { spec: VisualSpec; compact?: boolean; dense?: boolean; hero?: boolean }) {
  const lines = [spec.volumeLabel || null, spec.waterType, spec.bottleColor, spec.cap].filter(Boolean) as string[];

  if (dense) {
    return (
      <div className="flex flex-wrap gap-1">
        {lines.slice(0, 3).map((b) => (
          <span key={b} className="rounded-md bg-[var(--av-accent-soft)] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--av-accent)]">
            {b}
          </span>
        ))}
      </div>
    );
  }

  const img = hero ? "h-[280px] w-[220px]" : compact ? "h-[120px] w-[96px]" : "h-[200px] w-[160px]";

  return (
    <div className={`flex items-start gap-6 ${compact ? "" : "av-card p-6"} ${hero ? "sm:gap-8" : ""}`}>
      <div className={`relative shrink-0 overflow-hidden rounded-[var(--av-radius-md)] bg-[var(--av-bg)] ${img}`}>
        {spec.imageSrc ? (
          <Image src={spec.imageSrc} alt={spec.productName} fill className="object-contain p-2" sizes={hero ? "220px" : compact ? "96px" : "160px"} />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.12em] text-[var(--av-text-muted)]">
            Flaska
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="av-label">Profilvatten</p>
        <p className={`${hero ? "mt-2 text-[44px]" : compact ? "mt-1 text-[22px]" : "mt-1.5 text-[32px]"} font-semibold tracking-tight tabular-nums text-[var(--av-text)]`}>
          {spec.qty.toLocaleString("sv-SE")} ST
        </p>
        <p className={`${compact ? "mt-0.5 text-[14px]" : "mt-1 text-[16px]"} font-medium text-[var(--av-text)]`}>{spec.productName}</p>
        <div className={`${hero ? "mt-5 space-y-1" : "mt-3 space-y-0.5"}`}>
          {lines.map((line, i) => (
            <SpecLine key={line} strong={i === 0 || hero}>
              {line}
            </SpecLine>
          ))}
        </div>
      </div>
    </div>
  );
}
