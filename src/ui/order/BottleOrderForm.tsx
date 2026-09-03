"use client";

import { useMemo, useState } from "react";
import { placeBuyerOrderAction } from "@/actions";
import { addLeadTimeDays } from "@/domain/orderBrief";
import { bottleColorLabel, capLabel, waterTypeLabel } from "@/domain/bottleCatalog";
import { matchVariant, unique } from "@/domain/bottleVariants";
import { Button, controlClass } from "@/ui/shell/primitives";

type Variant = {
  id: string;
  name: string;
  productId: string;
  productName: string;
  moq: number;
  volumeMl: number | null;
  waterType: "stilla" | "kolsyrat";
  cap: string;
  color: string;
  leadTimeDays: number;
  tiers: { minQty: number; unitPriceExVat: number }[];
};

function unitFor(v: Variant | undefined, qty: number) {
  if (!v?.tiers.length) return null;
  const match = v.tiers.filter((t) => qty >= t.minQty).sort((a, b) => b.minQty - a.minQty)[0];
  return match?.unitPriceExVat ?? null;
}

export function BottleOrderForm({
  variants,
  addresses,
  fromDesign,
}: {
  variants: Variant[];
  addresses: { id: string; line1: string; city: string }[];
  fromDesign?: {
    designId: string;
    projectName: string;
    productId: string;
    qty: number;
    waterType: "stilla" | "kolsyrat";
    cap: string;
    color: string;
  } | null;
}) {
  const preferred =
    (fromDesign &&
      (variants.find((v) => v.productId === fromDesign.productId && v.waterType === fromDesign.waterType) ??
        variants.find((v) => v.productId === fromDesign.productId))) ||
    variants[0];
  const first = preferred;
  const sizes = unique(variants.map((v) => v.volumeMl).filter((n): n is number => n != null)).sort((a, b) => a - b);
  const [volumeMl, setVolumeMl] = useState<number | null>(first?.volumeMl ?? sizes[0] ?? null);
  const [waterType, setWaterType] = useState<"stilla" | "kolsyrat">(fromDesign?.waterType ?? first?.waterType ?? "stilla");
  const [cap, setCap] = useState(fromDesign?.cap ?? first?.cap ?? "skruvkork");
  const [color, setColor] = useState(fromDesign?.color ?? first?.color ?? "transparent");
  const [qty, setQty] = useState(fromDesign?.qty ?? first?.moq ?? 1);

  const types = unique(variants.filter((v) => v.volumeMl === volumeMl).map((v) => v.waterType));
  const resolvedType = types.includes(waterType) ? waterType : (types[0] ?? "stilla");
  const caps = unique(variants.filter((v) => v.volumeMl === volumeMl && v.waterType === resolvedType).map((v) => v.cap));
  const resolvedCap = caps.includes(cap) ? cap : (caps[0] ?? "skruvkork");
  const colors = unique(
    variants.filter((v) => v.volumeMl === volumeMl && v.waterType === resolvedType).map((v) => v.color),
  );
  const resolvedColor = colors.includes(color) ? color : (colors[0] ?? "transparent");
  const selected = matchVariant(variants, volumeMl, resolvedType, resolvedCap, resolvedColor) ?? first;
  const unit = useMemo(() => unitFor(selected, qty), [selected, qty]);
  const line = unit != null ? Math.round(unit * qty * 100) / 100 : null;
  const prelim = selected ? addLeadTimeDays(selected.leadTimeDays) : null;

  function applySize(nextMl: number) {
    const nextTypes = unique(variants.filter((v) => v.volumeMl === nextMl).map((v) => v.waterType));
    const nextType = nextTypes.includes(waterType) ? waterType : (nextTypes[0] ?? "stilla");
    const next = matchVariant(variants, nextMl, nextType, cap, color);
    setVolumeMl(nextMl);
    setWaterType(nextType);
    if (next && qty < next.moq) setQty(next.moq);
  }

  return (
    <form action={placeBuyerOrderAction} className="space-y-4">
      {fromDesign ? <input type="hidden" name="designId" value={fromDesign.designId} /> : null}
      <input type="hidden" name="variantId" value={selected?.id ?? ""} />
      <input type="hidden" name="waterType" value={resolvedType} />
      <input type="hidden" name="cap" value={resolvedCap} />
      <input type="hidden" name="color" value={resolvedColor} />
      {selected ? (
        <p className="text-sm">
          <span className="text-[var(--av-text-muted)]">Produkt · </span>
          <span className="font-medium">{selected.productName}</span>
        </p>
      ) : null}
      {fromDesign ? (
        <p className="text-sm text-[var(--av-text-muted)]">Artwork från studion: {fromDesign.projectName}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Storlek</span>
          <select className={`${controlClass} mt-1`} value={volumeMl ?? ""} onChange={(e) => applySize(Number(e.target.value))}>
            {sizes.map((ml) => (
              <option key={ml} value={ml}>
                {Math.round(ml / 10)} cl
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Stilla / kolsyrat</span>
          <select
            className={`${controlClass} mt-1`}
            value={resolvedType}
            onChange={(e) => setWaterType(e.target.value as "stilla" | "kolsyrat")}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {waterTypeLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Kapsyl</span>
          <select className={`${controlClass} mt-1`} value={resolvedCap} onChange={(e) => setCap(e.target.value)}>
            {caps.map((c) => (
              <option key={c} value={c}>
                {capLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Färg</span>
          <select className={`${controlClass} mt-1`} value={resolvedColor} onChange={(e) => setColor(e.target.value)}>
            {colors.map((c) => (
              <option key={c} value={c}>
                {bottleColorLabel(c)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {prelim ? (
        <div className="av-card p-5">
          <p className="av-label">Preliminärt leveransdatum</p>
          <p className="mt-1 text-[28px] font-semibold tabular-nums tracking-tight">{prelim}</p>
          <p className="mt-2 text-sm text-[var(--av-text-muted)]">
            Detta är endast en uppskattning. Slutligt datum måste bekräftas av AquaVisibility i orderbekräftelsen.
          </p>
        </div>
      ) : null}
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Antal</span>
        <input
          name="qty"
          type="number"
          min={selected?.moq ?? 1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value) || selected?.moq || 1)}
          className={`${controlClass} mt-1`}
          required
        />
      </label>
      {line != null ? (
        <p className="rounded-2xl bg-[var(--av-bg)] px-4 py-3 text-sm">
          <span className="font-semibold tabular-nums">{line.toLocaleString("sv-SE")} kr ex moms</span>
          <span className="ml-2 text-[var(--av-text-muted)]">
            {unit?.toFixed(2)} kr/st · {qty.toLocaleString("sv-SE")} st
          </span>
        </p>
      ) : (
        <p className="text-sm text-[var(--av-text-muted)]">Kontakta AquaVisibility för pris vid detta antal.</p>
      )}
      {addresses.length ? (
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Leveransadress</span>
          <select name="addressId" className={`${controlClass} mt-1`}>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.line1}, {a.city}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-[var(--av-text-muted)]">Adress</span>
            <input name="line1" placeholder="Gatuadress" className={`${controlClass} mt-1`} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--av-text-muted)]">Postnr</span>
            <input name="postalCode" placeholder="123 45" className={`${controlClass} mt-1`} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--av-text-muted)]">Ort</span>
            <input name="city" placeholder="Stad" className={`${controlClass} mt-1`} />
          </label>
        </div>
      )}
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Fakturareferens</span>
        <input name="invoiceRef" placeholder="Er referens" className={`${controlClass} mt-1`} />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Önskat leveransdatum</span>
        <input name="requestedDate" type="date" className={`${controlClass} mt-1`} />
        <p className="mt-1 text-[12px] text-[var(--av-text-muted)]">
          Preliminärt — inte slutgiltigt. AquaVisibility bekräftar datum i orderbekräftelsen.
        </p>
      </label>
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Viktigt leveranskrav</span>
        <textarea
          name="deliveryRequirement"
          placeholder="T.ex. eventdatum som inte får missas"
          className={`${controlClass} mt-1 h-auto py-2`}
          rows={2}
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Kommentar</span>
        <textarea name="notes" placeholder="Övriga instruktioner" className={`${controlClass} mt-1 h-auto py-2`} rows={2} />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Artwork (PNG, JPG, SVG, PDF, AI)</span>
        <input type="file" name="artwork" accept=".png,.jpg,.jpeg,.svg,.pdf,.ai" className="mt-1 block w-full text-sm" />
        <p className="mt-1 text-[12px] text-[var(--av-text-muted)]">
          Valfritt. Ni kan också ladda upp efter att ordern skickats, eller designa i studion.
        </p>
      </label>
      <Button type="submit">Skicka order</Button>
    </form>
  );
}
