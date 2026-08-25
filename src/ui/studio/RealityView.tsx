"use client";

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
          <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-[#F4F5F7] px-8 text-center">
            <p className="text-sm text-[#6b7280]">
              {loading ? "GPT Image 2 sätter din etikett på produkten…" : "Ingen verklighetsbild ännu."}
            </p>
          </div>
        )}
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/90 px-4 py-2 text-[13px] font-medium text-[#3B5BAA] shadow-sm">
              Skapar fotorealistisk bild…
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
