"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { previewPriceAction } from "@/actions/checkout";
import {
  bottleColorShopLabel,
  capShopLabel,
  parseBottleOptions,
  type WaterKind,
  waterKindFromOptionsJson,
  waterKindLabel,
  waterTypeForOrder,
} from "@/domain/bottleCatalog";
import { CAP_CHOICES, COLOR_CHOICES, matchVariant, unique } from "@/domain/bottleVariants";
import type { ProductSelection } from "@/domain/productSelection";
import { volumeLabel } from "@/domain/productFacts";
import { Button } from "@/ui/shell/primitives";

export type ConfigVariant = {
  id: string;
  volumeMl: number | null;
  packSize: number;
  optionsJson: string;
};

type Row = ConfigVariant & { waterType: WaterKind; cap?: string; color?: string };

export function ProductConfigurator({
  productId,
  slug,
  moq,
  variants,
  canSeePrices,
  designId,
  onOrder,
  onPreview,
}: {
  productId: string;
  slug: string;
  moq: number;
  variants: ConfigVariant[];
  canSeePrices: boolean;
  designId?: string;
  onOrder: (selection: ProductSelection) => void;
  onPreview?: (preview: { volume: string | null; water: string }) => void;
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
    onPreview?.({
      volume: selected ? volumeLabel(selected.volumeMl) : null,
      water: waterKindLabel(resolvedType),
    });
  }, [onPreview, resolvedType, selected]);

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

  const summary = [volumeLabel(selected?.volumeMl ?? volumeMl), waterKindLabel(resolvedType), capShopLabel(cap)]
    .filter(Boolean)
    .join(" · ");

  function bump(delta: number) {
    setQty((n) => Math.max(moq, n + delta));
  }

  return (
    <div className="av-config">
      <div className="av-config-head">
        <p className="av-config-kicker">Din flaska</p>
        <p className="av-config-summary">{summary}</p>
      </div>

      <div className="av-config-scroll">
        {sizes.length ? (
          <fieldset className="av-config-field">
            <legend>Volym</legend>
            <div className="av-seg" role="group" aria-label="Volym">
              {sizes.map((ml) => (
                <button
                  key={ml}
                  type="button"
                  aria-pressed={volumeMl === ml}
                  onClick={() => setVolumeMl(ml)}
                >
                  {volumeLabel(ml)}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {types.length > 1 ? (
          <fieldset className="av-config-field">
            <legend>Vatten</legend>
            <div className="av-seg" role="group" aria-label="Vatten">
              {types.map((t) => (
                <button key={t} type="button" aria-pressed={resolvedType === t} onClick={() => setWaterType(t)}>
                  {waterKindLabel(t)}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="av-config-grid">
          <label className="av-config-field">
            <span>Kork</span>
            <select className="av-config-select" value={cap} onChange={(e) => setCap(e.target.value)}>
              {CAP_CHOICES.map((c) => (
                <option key={c} value={c}>
                  {capShopLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="av-config-field">
            <span>Färg</span>
            <select className="av-config-select" value={color} onChange={(e) => setColor(e.target.value)}>
              {COLOR_CHOICES.map((c) => (
                <option key={c} value={c}>
                  {bottleColorShopLabel(c)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="av-config-field">
          <span>Antal</span>
          <div className="av-stepper">
            <button type="button" aria-label="Minska antal" onClick={() => bump(-pack)} disabled={qty <= moq}>
              −
            </button>
            <input
              type="number"
              min={moq}
              step={pack}
              value={qty}
              onChange={(e) => setQty(Math.max(moq, Number(e.target.value) || moq))}
            />
            <button type="button" aria-label="Öka antal" onClick={() => bump(pack)}>
              +
            </button>
          </div>
          <p className="av-config-hint">Minst {moq.toLocaleString("sv-SE")} st</p>
        </div>

        <fieldset className="av-config-field">
          <legend>Artwork</legend>
          <div className="av-seg" role="radiogroup" aria-label="Artwork">
            <button type="button" aria-pressed={!artworkNow} onClick={() => setArtworkNow(false)}>
              Senare
            </button>
            <button type="button" aria-pressed={artworkNow} onClick={() => setArtworkNow(true)}>
              Designa nu
            </button>
          </div>
          {artworkNow ? (
            <p className="av-config-hint">
              <Link href={`/designa/${slug}?next=/produkter/profilvatten/${slug}`}>Öppna studion</Link>
            </p>
          ) : (
            <p className="av-config-hint">Du kan skicka filen efter ordern.</p>
          )}
        </fieldset>
      </div>

      <div className="av-config-foot">
        {canSeePrices ? (
          quote ? (
            <p className="av-config-price">
              {quote.lineExVat.toLocaleString("sv-SE")} exkl. moms
              <span>
                {quote.unitPriceExVat.toLocaleString("sv-SE")} / st
              </span>
            </p>
          ) : (
            <p className="av-config-hint">Kontakta oss för pris vid detta antal.</p>
          )
        ) : (
          <p className="av-config-hint">Pris visas när du skapar konto</p>
        )}
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
    </div>
  );
}
