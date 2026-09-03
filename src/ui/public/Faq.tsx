import type { ReactNode } from "react";

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="av-hairline">
      {items.map((it) => (
        <details key={it.q} className="group border-b border-[var(--av-border)]">
          <summary className="av-soft-focus flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-[var(--av-text)] [&::-webkit-details-marker]:hidden">
            {it.q}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-hidden
              className="shrink-0 transition-transform duration-200 group-open:rotate-45"
            >
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="pb-4 text-[14px] leading-relaxed text-[var(--av-text-secondary)]">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
