"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="mt-6 rounded-xl border px-4 py-2 text-sm">
      Skriv ut
    </button>
  );
}
