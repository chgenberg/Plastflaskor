"use client";

import { useState } from "react";

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Kunde inte läsa filen."));
    reader.readAsDataURL(file);
  });
}

export function StudioOnboard({
  productName,
  categorySlug,
  onApply,
  onClose,
}: {
  productName: string;
  categorySlug: string;
  onApply: (next: { logo?: string; background?: string; fromAi?: boolean }) => void;
  onClose: () => void;
}) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(kind: "logo" | "background", file: File | undefined) {
    if (!file) return;
    const url = await readFile(file);
    if (kind === "logo") {
      setLogoFile(file);
      setLogoPreview(url);
    } else {
      setBgFile(file);
      setBgPreview(url);
    }
  }

  function applyUploads() {
    onApply({
      logo: logoPreview ?? undefined,
      background: bgPreview ?? undefined,
    });
    onClose();
  }

  async function generate() {
    if (!logoFile && !bgFile) {
      setError("Ladda upp logotyp eller bakgrund först.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      if (logoFile) fd.append("logo", logoFile, logoFile.name);
      if (bgFile) fd.append("background", bgFile, bgFile.name);
      fd.append("meta", JSON.stringify({ productName, categorySlug }));
      const res = await fetch("/api/studio/compose", { method: "POST", body: fd });
      const data = (await res.json()) as { imageDataUrl?: string; error?: string };
      if (!res.ok || !data.imageDataUrl) throw new Error(data.error ?? "Kunde inte skapa etiketten.");
      onApply({
        background: data.imageDataUrl,
        fromAi: true,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skapa etiketten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1d1d1f]/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[440px] rounded-[28px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,.22)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Ny etikett</p>
        <h2 className="mt-1 text-[22px] font-semibold tracking-tight">Ladda upp och skapa</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6b7280]">
          Lägg in er logotyp och en bakgrund. GPT Image 2 komponerar en tryckklar etikett som du sedan kan justera.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <UploadSlot
            label="Logotyp"
            hint="PNG eller SVG"
            preview={logoPreview}
            onFile={(f) => void pick("logo", f)}
          />
          <UploadSlot
            label="Bakgrund"
            hint="PNG eller JPG"
            preview={bgPreview}
            cover
            onFile={(f) => void pick("background", f)}
          />
        </div>

        {error ? <p className="mt-3 text-[13px] text-red-600">{error}</p> : null}

        <div className="mt-5 space-y-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void generate()}
            className="h-12 w-full rounded-full bg-[#5B7FD4] text-[14px] font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Skapar etikett…" : "Skapa etikett med AI"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={applyUploads}
            className="h-11 w-full rounded-full text-[13px] font-medium text-[#3B5BAA] hover:bg-[#E8EEFA]"
          >
            Använd filerna utan AI
          </button>
          <button type="button" disabled={loading} onClick={onClose} className="h-10 w-full text-[13px] text-[#6b7280]">
            Fortsätt med exempel
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadSlot({
  label,
  hint,
  preview,
  cover,
  onFile,
}: {
  label: string;
  hint: string;
  preview: string | null;
  cover?: boolean;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-dashed border-black/15">
      <span className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">{label}</span>
      <span className="relative mt-1 flex h-28 items-center justify-center bg-[#F4F5F7]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className={cover ? "h-full w-full object-cover" : "max-h-20 w-auto object-contain"} />
        ) : (
          <span className="px-3 text-center text-[12px] text-[#9ca3af]">{hint}</span>
        )}
      </span>
      <input
        type="file"
        accept=".png,.jpg,.jpeg,.svg,.webp"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </label>
  );
}
