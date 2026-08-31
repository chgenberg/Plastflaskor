"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-6 inline-flex h-12 items-center justify-center rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-5 text-[15px] font-semibold"
    >
      Skriv ut
    </button>
  );
}
