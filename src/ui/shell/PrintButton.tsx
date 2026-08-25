"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-6 inline-flex h-12 items-center justify-center rounded-full border border-black/10 px-5 text-[15px] font-semibold"
    >
      Skriv ut
    </button>
  );
}
