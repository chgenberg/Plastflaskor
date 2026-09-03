"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { previewPriceAction } from "@/actions/checkout";
import {
  bottleColorLabel,
  capLabel,
  parseBottleOptions,
  type WaterKind,
  waterKindFromOptionsJson,
  waterKindLabel,
  waterTypeForOrder,
} from "@/domain/bottleCatalog";
import { CAP_CHOICES, COLOR_CHOICES, matchVariant, unique } from "@/domain/bottleVariants";
import type { ProductSelection } from "@/domain/productSelection";
import { volumeLabel } from "@/domain/productFacts";
import { Button, controlClass } from "@/ui/shell/primitives";

export type ConfigVariant = {
  id: string;
  volumeMl: number | null;
  packSize: number;
  optionsJson: string;
};

type Row = ConfigVariant & { waterType: WaterKind; cap?: string; color?: string };

function chipClass(on: boolean) {
  return `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
    on
      ? "border-[var(--av-ink)] bg-[var(--av-ink)] text-[var(--av-surface)]"
      : "border-[var(--av-border-strong)] bg-[var(--av-surface)] text-[var(--av-text)]"
  }`;
}

export function ProductConfigurator({
  productId,
  slug,
  moq,
  variants,
  canSeePrices,
  designId,
  onOrder,
}: {
  productId: string;
  slug: string;
  moq: number;
  variants: ConfigVariant[];
  canSeePrices: boolean;
  designId?: string;
  onOrder: (selection: ProductSelection) => void;
}) {
  const rows: Row[] = useMemo(
    () =>
      variants.map((v) => {
        const opt = parseBottleOptions(v.optionsJson);
        return { ...v, waterType: waterKindFromOptionsJson(v.optionsJson), cap: opt.cap, color: opt.color };
      }),
    [variants],
  );
  const first = rows[0];
  const sizes = unique(rows.map((v) => v.volumeMl).filter((n): n is number => n != null)).sort((a, b) => a - b);
  const [volumeMl, setVolumeMl] = useState<number | null>(first?.volumeMl ?? sizes[0] ?? null);
  const [waterType, setWaterType] = useState<WaterKind>(first?.waterType ?? "stilla");
  const [cap, setCap] = useState(first?.cap ?? "skruvkork");
  const [color, setColor] = useState(first?.color ?? "transparent");
  const [qty, setQty] = useState(moq);
  const [artworkNow, setArtworkNow] = useState(false);
  const [quote, setQuote] = useState<{ unitPriceExVat: number; lineExVat: number } | null>(null);

  const types = unique(rows.filter((v) => v.volumeMl === volumeMl).map((v) => v.waterType));
  const resolvedType = types.includes(waterType) ? waterType : (types[0] ?? "stilla");
  const selected = matchVariant(rows, volumeMl, resolvedType, cap, color) ?? first;
  const pack = selected?.packSize && selected.packSize > 1 ? selected.packSize : 1;
  const belowMoq = qty < moq;

  useEffect(() => {
    if (!canSeePrices || !selected) {
      setQuote(null);
      return;
    }
    const handle = window.setTimeout(() => {
      void previewPriceAction({ variantId: selected.id, qty }).then(setQuote);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [canSeePrices, qty, selected]);

  const selection: ProductSelection | null = selected
    ? {
        productId,
        variantId: selected.id,
        qty,
        options: { waterType: waterTypeForOrder(resolvedType), cap, color },
        designId,
      }
    : null;

  return (
    <div className="av-card space-y-4 p-6">
      {sizes.length ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Volym</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((ml) => (
              <button key={ml} type="button" className={chipClass(volumeMl === ml)} onClick={() => setVolumeMl(ml)}>
                {volumeLabel(ml)}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {types.length > 1 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Vatten</legend>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className={chipClass(resolvedType === t)}
                onClick={() => setWaterType(t)}
              >
                {waterKindLabel(t)}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="block text-sm font-medium">
        Kork
        <select className={`${controlClass} mt-1.5`} value={cap} onChange={(e) => setCap(e.target.value)}>
          {CAP_CHOICES.map((c) => (
            <option key={c} value={c}>
              {capLabel(c)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Flaskfärg
        <select className={`${controlClass} mt-1.5`} value={color} onChange={(e) => setColor(e.target.value)}>
          {COLOR_CHOICES.map((c) => (
            <option key={c} value={c}>
              {bottleColorLabel(c)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Antal
        <input
          type="number"
          min={moq}
          step={pack}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value) || moq)}
          className={`${controlClass} mt-1.5`}
        />
        <span className="mt-1 block text-[12px] text-[var(--av-text-muted)]">Minst {moq} st</span>
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Artwork</legend>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="artwork-when" checked={!artworkNow} onChange={() => setArtworkNow(false)} />
          Skicka senare
        </label>
        <label className="mt-2 flex items-start gap-2 text-sm">
          <input type="radio" name="artwork-when" checked={artworkNow} onChange={() => setArtworkNow(true)} />
          Designa nu
        </label>
        {artworkNow ? (
          <p className="mt-2 text-sm">
            <Link
              href={`/designa/${slug}?next=/produkter/profilvatten/${slug}`}
              className="font-medium text-[var(--av-accent)]"
            >
              Öppna studion
            </Link>
          </p>
        ) : null}
      </fieldset>

      {canSeePrices ? (
        quote ? (
          <p className="text-sm font-medium">
            {quote.lineExVat.toLocaleString("sv-SE")} exkl. moms ({quote.unitPriceExVat.toLocaleString("sv-SE")} / st)
          </p>
        ) : (
          <p className="text-sm text-[var(--av-text-muted)]">Kontakta oss för pris vid detta antal.</p>
        )
      ) : (
        <p className="text-sm text-[var(--av-text-muted)]">Pris visas när du skapar konto</p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer font-medium">Trygg beställning</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--av-text-secondary)]">
          <li>Ingen betalning nu. Faktura kommer efter leverans.</li>
          <li>Aqua bekräftar leveransdatum i orderbekräftelsen.</li>
          <li>Artwork kan skickas senare.</li>
        </ul>
      </details>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!selection || belowMoq}
        onClick={() => selection && onOrder(selection)}
      >
        Beställ
      </Button>
    </div>
  );
}
