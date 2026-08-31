"use client";

import { useMemo, useState } from "react";
import { placeBuyerOrderAction } from "@/actions";
import { addLeadTimeDays } from "@/domain/orderBrief";
import { Button } from "@/ui/shell/primitives";

type Variant = {
  id: string;
  name: string;
  productName: string;
  moq: number;
  volumeMl: number | null;
  wall: "enkel" | "dubbel";
  eco: boolean;
  leadTimeDays: number;
  tiers: { minQty: number; unitPriceExVat: number }[];
};

function unitFor(v: Variant | undefined, qty: number) {
  if (!v?.tiers.length) return null;
  const match = v.tiers.filter((t) => qty >= t.minQty).sort((a, b) => b.minQty - a.minQty)[0];
  return match?.unitPriceExVat ?? null;
}

function unique<T>(xs: T[]) {
  return [...new Set(xs)];
}

function wallsFor(variants: Variant[], volumeMl: number | null) {
  return unique(variants.filter((v) => v.volumeMl === volumeMl).map((v) => v.wall));
}

function ecosFor(variants: Variant[], volumeMl: number | null, wall: "enkel" | "dubbel") {
  return unique(variants.filter((v) => v.volumeMl === volumeMl && v.wall === wall).map((v) => v.eco));
}

function matchVariant(variants: Variant[], volumeMl: number | null, wall: "enkel" | "dubbel", eco: boolean) {
  return variants.find((v) => v.volumeMl === volumeMl && v.wall === wall && v.eco === eco);
}

export function CupOrderForm({
  variants,
  addresses,
  customers,
  showCustomerSelect,
}: {
  variants: Variant[];
  addresses: { id: string; line1: string; city: string }[];
  customers?: { id: string; name: string }[];
  showCustomerSelect?: boolean;
}) {
  const first = variants[0];
  const sizes = unique(variants.map((v) => v.volumeMl).filter((n): n is number => n != null)).sort((a, b) => a - b);
  const [volumeMl, setVolumeMl] = useState<number | null>(first?.volumeMl ?? sizes[0] ?? null);
  const [wall, setWall] = useState<"enkel" | "dubbel">(first?.wall ?? "enkel");
  const [eco, setEco] = useState(first?.eco ?? false);
  const [qty, setQty] = useState(first?.moq ?? 500);

  const availableWalls = wallsFor(variants, volumeMl);
  const availableEcos = ecosFor(variants, volumeMl, availableWalls.includes(wall) ? wall : availableWalls[0] ?? "enkel");
  const resolvedWall = availableWalls.includes(wall) ? wall : availableWalls[0] ?? "enkel";
  const resolvedEco = availableEcos.includes(eco) ? eco : (availableEcos[0] ?? false);
  const selected = matchVariant(variants, volumeMl, resolvedWall, resolvedEco) ?? first;
  const unit = useMemo(() => unitFor(selected, qty), [selected, qty]);
  const line = unit != null ? Math.round(unit * qty * 100) / 100 : null;
  const prelim = selected ? addLeadTimeDays(selected.leadTimeDays) : null;

  function applySize(nextMl: number) {
    const nextWalls = wallsFor(variants, nextMl);
    const nextWall = nextWalls.includes(wall) ? wall : nextWalls[0] ?? "enkel";
    const nextEcos = ecosFor(variants, nextMl, nextWall);
    const nextEco = nextEcos.includes(eco) ? eco : (nextEcos[0] ?? false);
    const next = matchVariant(variants, nextMl, nextWall, nextEco);
    setVolumeMl(nextMl);
    setWall(nextWall);
    setEco(nextEco);
    if (next && qty < next.moq) setQty(next.moq);
  }

  function applyWall(nextWall: "enkel" | "dubbel") {
    const nextEcos = ecosFor(variants, volumeMl, nextWall);
    const nextEco = nextEcos.includes(eco) ? eco : (nextEcos[0] ?? false);
    const next = matchVariant(variants, volumeMl, nextWall, nextEco);
    setWall(nextWall);
    setEco(nextEco);
    if (next && qty < next.moq) setQty(next.moq);
  }

  function applyEco(nextEco: boolean) {
    const next = matchVariant(variants, volumeMl, resolvedWall, nextEco);
    setEco(nextEco);
    if (next && qty < next.moq) setQty(next.moq);
  }

  return (
    <form action={placeBuyerOrderAction} className="space-y-4">
      {showCustomerSelect && customers?.length ? (
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Kund</span>
          <select name="customerId" className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2" required>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <input type="hidden" name="variantId" value={selected?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Storlek</span>
          <select
            className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
            value={volumeMl ?? ""}
            onChange={(e) => applySize(Number(e.target.value))}
          >
            {sizes.map((ml) => (
              <option key={ml} value={ml}>
                {Math.round(ml / 10)} cl
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Vägg</span>
          <select
            className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
            value={resolvedWall}
            onChange={(e) => applyWall(e.target.value as "enkel" | "dubbel")}
          >
            {availableWalls.map((w) => (
              <option key={w} value={w}>
                {w === "dubbel" ? "Dubbel" : "Enkel"}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">ECO</span>
          <select
            className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
            value={resolvedEco ? "ja" : "nej"}
            onChange={(e) => applyEco(e.target.value === "ja")}
          >
            {availableEcos.map((e) => (
              <option key={e ? "ja" : "nej"} value={e ? "ja" : "nej"}>
                {e ? "Ja" : "Nej"}
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
          min={selected?.moq ?? 500}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value) || selected?.moq || 500)}
          className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
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
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Ytfinish</span>
          <select name="finish" className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2">
            <option value="matte">Matt</option>
            <option value="glossy">Glans</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Lock</span>
          <select name="lid" className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2">
            <option value="none">Utan lock</option>
            <option value="white">Vitt lock</option>
            <option value="black">Svart lock</option>
          </select>
        </label>
      </div>
      {addresses.length ? (
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Leveransadress</span>
          <select name="addressId" className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2">
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.line1}, {a.city}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <input name="line1" placeholder="Adress" className="rounded-xl border border-[var(--av-border-strong)] px-3 py-2 text-sm" />
          <input name="postalCode" placeholder="Postnr" className="rounded-xl border border-[var(--av-border-strong)] px-3 py-2 text-sm" />
          <input name="city" placeholder="Ort" className="rounded-xl border border-[var(--av-border-strong)] px-3 py-2 text-sm" />
        </div>
      )}
      <input name="invoiceRef" placeholder="Fakturareferens" className="w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2 text-sm" />
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Önskat leveransdatum</span>
        <input name="requestedDate" type="date" className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2" />
        <p className="mt-1 text-[12px] text-[var(--av-text-muted)]">
          Preliminärt — inte slutgiltigt. AquaVisibility bekräftar datum i orderbekräftelsen.
        </p>
      </label>
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Viktigt leveranskrav</span>
        <textarea
          name="deliveryRequirement"
          placeholder="T.ex. eventdatum som inte får missas"
          className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2 text-sm"
          rows={2}
        />
      </label>
      <textarea name="notes" placeholder="Kommentar" className="w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2 text-sm" rows={2} />
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Tryckfil (PNG, JPG, SVG, PDF, AI)</span>
        <input type="file" name="artwork" accept=".png,.jpg,.jpeg,.svg,.pdf,.ai" className="mt-1 block w-full text-sm" />
        <p className="mt-1 text-[12px] text-[var(--av-text-muted)]">
          Valfritt. Ni kan också ladda upp efter att ordern skickats, eller designa i studion.
        </p>
      </label>
      <Button type="submit">Skicka order</Button>
    </form>
  );
}
