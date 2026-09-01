"use client";

import { useMemo, useState } from "react";
import { createManualOrderAction } from "@/actions";
import { addLeadTimeDays } from "@/domain/orderBrief";
import { bottleColorLabel, capLabel, waterTypeLabel } from "@/domain/bottleCatalog";
import { priceListDisplayName } from "@/domain/priceLists";
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

function unique<T>(xs: T[]) {
  return [...new Set(xs)];
}

function matchVariant(
  variants: Variant[],
  volumeMl: number | null,
  waterType: "stilla" | "kolsyrat",
  cap: string,
  color: string,
) {
  return (
    variants.find((v) => v.volumeMl === volumeMl && v.waterType === waterType && v.cap === cap && v.color === color) ??
    variants.find((v) => v.volumeMl === volumeMl && v.waterType === waterType) ??
    variants.find((v) => v.volumeMl === volumeMl)
  );
}

export function ManualOrderCustomerPicker({
  customers,
  selected,
}: {
  customers: { id: string; name: string; orgNr: string | null }[];
  selected: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--av-text-muted)]">Kund</span>
      <select
        className={`${controlClass} mt-1`}
        value={selected}
        onChange={(e) => {
          const value = e.target.value;
          window.location.href = value ? `/operations/ordrar/ny?kund=${encodeURIComponent(value)}` : "/operations/ordrar/ny";
        }}
      >
        <option value="">Välj kund</option>
        <option value="ny">Ny kund från mejlet</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.orgNr ? ` · ${c.orgNr}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ManualOrderForm({
  variants,
  addresses,
  customerId,
  isNewCustomer,
  priceLists,
  selectedPriceListId,
}: {
  variants: Variant[];
  addresses: { id: string; line1: string; city: string }[];
  customerId?: string;
  isNewCustomer?: boolean;
  priceLists: { id: string; name: string }[];
  selectedPriceListId?: string;
}) {
  const first = variants[0];
  const sizes = unique(variants.map((v) => v.volumeMl).filter((n): n is number => n != null)).sort((a, b) => a - b);
  const [volumeMl, setVolumeMl] = useState<number | null>(first?.volumeMl ?? sizes[0] ?? null);
  const [waterType, setWaterType] = useState<"stilla" | "kolsyrat">(first?.waterType ?? "stilla");
  const [cap, setCap] = useState(first?.cap ?? "skruvkork");
  const [color, setColor] = useState(first?.color ?? "transparent");
  const [qty, setQty] = useState(first?.moq ?? 270);
  const [newAddress, setNewAddress] = useState(addresses.length === 0);

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
    <form action={createManualOrderAction} className="space-y-4">
      {customerId ? <input type="hidden" name="customerId" value={customerId} /> : null}
      <input type="hidden" name="variantId" value={selected?.id ?? ""} />
      <input type="hidden" name="waterType" value={resolvedType} />
      <input type="hidden" name="cap" value={resolvedCap} />
      <input type="hidden" name="color" value={resolvedColor} />

      {isNewCustomer ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--av-text-muted)]">Företag</span>
            <input name="newName" required className={`${controlClass} mt-1`} placeholder="Namn från inköpsordern" />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--av-text-muted)]">Org.nr</span>
            <input name="newOrgNr" className={`${controlClass} mt-1`} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--av-text-muted)]">E-post</span>
            <input name="newEmail" type="email" className={`${controlClass} mt-1`} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--av-text-muted)]">Telefon</span>
            <input name="newPhone" type="tel" className={`${controlClass} mt-1`} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--av-text-muted)]">Prislista</span>
            <select name="newPriceListId" className={`${controlClass} mt-1`} defaultValue={selectedPriceListId ?? ""}>
              <option value="">Standard</option>
              {priceLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {priceListDisplayName(list.name)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {selected ? (
        <p className="text-sm">
          <span className="text-[var(--av-text-muted)]">Produkt · </span>
          <span className="font-medium">{selected.productName}</span>
        </p>
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
            Uppskattning från ledtid. Slutligt datum bekräftas i orderbekräftelsen.
          </p>
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Antal</span>
        <input
          name="qty"
          type="number"
          min={selected?.moq ?? 270}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value) || selected?.moq || 270)}
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
        <p className="text-sm text-[var(--av-text-muted)]">Inget pris i vald prislista för detta antal.</p>
      )}

      {addresses.length ? (
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Leveransadress</span>
          <select
            name="addressId"
            className={`${controlClass} mt-1`}
            defaultValue={newAddress ? "" : addresses[0]?.id}
            onChange={(e) => setNewAddress(!e.target.value)}
          >
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.line1}, {a.city}
              </option>
            ))}
            <option value="">Ny adress från inköpsordern</option>
          </select>
        </label>
      ) : null}

      {newAddress || !addresses.length ? (
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
      ) : null}

      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Inköpsorder / er referens</span>
        <input name="invoiceRef" placeholder="PO-nummer från mejlet" className={`${controlClass} mt-1`} />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Önskat leveransdatum</span>
        <input name="requestedDate" type="date" className={`${controlClass} mt-1`} />
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
        <span className="text-[var(--av-text-muted)]">Anteckning från mejlet</span>
        <textarea
          name="notes"
          placeholder="Klistra in det som behövs från inköpsordern"
          className={`${controlClass} mt-1 h-auto py-2`}
          rows={4}
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Inköpsorder (PDF eller bild)</span>
        <input type="file" name="purchaseOrder" accept=".pdf,.png,.jpg,.jpeg,.webp" className="mt-1 block w-full text-sm" />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--av-text-muted)]">Artwork (PNG, JPG, SVG, PDF, AI)</span>
        <input type="file" name="artwork" accept=".png,.jpg,.jpeg,.svg,.pdf,.ai" className="mt-1 block w-full text-sm" />
      </label>
      <Button type="submit">Registrera order</Button>
    </form>
  );
}
