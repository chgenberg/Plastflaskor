"use client";

import type { Layer } from "./engine/types";

export function SelectionHud({
  layer,
  onCenter,
  onFlip,
  onForward,
  onBack,
  onDelete,
  onScale,
  onColor,
  onAlign,
  onQr,
  onFit,
}: {
  layer: Layer;
  onCenter: () => void;
  onFlip: () => void;
  onForward: () => void;
  onBack: () => void;
  onDelete: () => void;
  onScale: (scale: number) => void;
  onColor: (color: string) => void;
  onAlign: (align: "left" | "center" | "right") => void;
  onQr: (text: string) => void;
  onFit: (fit: "cover" | "contain") => void;
}) {
  if (layer.type === "artwork") {
    return (
      <>
        <button type="button" onClick={() => onFit("cover")}>
          Fyll
        </button>
        <button type="button" onClick={() => onFit("contain")}>
          Safe
        </button>
        <button type="button" onClick={onDelete}>
          Ta bort
        </button>
      </>
    );
  }

  if (layer.type === "text") {
    return (
      <>
        <button type="button" onClick={() => onScale(Math.max(0.3, layer.scale - 0.1))} aria-label="Mindre text">
          A−
        </button>
        <button type="button" onClick={() => onScale(Math.min(4, layer.scale + 0.1))} aria-label="Större text">
          A+
        </button>
        <label>
          <span className="sr-only">Textfärg</span>
          <input type="color" value={layer.color ?? "#1d1d1f"} onChange={(e) => onColor(e.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" />
        </label>
        <button type="button" onClick={() => onAlign("left")} aria-label="Vänsterställ">
          V
        </button>
        <button type="button" onClick={() => onAlign("center")} aria-label="Centrera">
          M
        </button>
        <button type="button" onClick={() => onAlign("right")} aria-label="Högerställ">
          H
        </button>
      </>
    );
  }

  if (layer.type === "qr") {
    return (
      <>
        <label>
          <span className="sr-only">QR-länk</span>
          <input
            value={layer.text ?? ""}
            onChange={(e) => onQr(e.target.value)}
            placeholder="https://"
            className="h-7 w-36 border-0 bg-transparent px-2 text-[11px] outline-none"
          />
        </label>
        <button type="button" onClick={onDelete}>
          Ta bort
        </button>
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={onCenter}>
        Centrera
      </button>
      <button type="button" onClick={onFlip}>
        Spegla
      </button>
      <button type="button" onClick={onForward}>
        Fram
      </button>
      <button type="button" onClick={onBack}>
        Bak
      </button>
      <button type="button" onClick={onDelete}>
        Ta bort
      </button>
    </>
  );
}
