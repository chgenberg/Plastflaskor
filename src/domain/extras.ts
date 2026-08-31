export type ExtraKind = "freight" | "express" | "setup" | "special" | "discount" | "other";

export type ExtraLine = {
  kind: ExtraKind;
  label: string;
  amountExVat: number;
};

export const EXTRA_KINDS: { kind: ExtraKind; label: string }[] = [
  { kind: "freight", label: "Frakt" },
  { kind: "express", label: "Express" },
  { kind: "setup", label: "Startkostnad" },
  { kind: "special", label: "Specialkostnad" },
  { kind: "discount", label: "Rabatt" },
  { kind: "other", label: "Övrigt" },
];

export function parseExtras(raw?: string | null): ExtraLine[] {
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw) as ExtraLine[];
    return Array.isArray(rows) ? rows.filter((r) => typeof r.amountExVat === "number") : [];
  } catch {
    return [];
  }
}

export function extrasTotal(lines: ExtraLine[]) {
  return Math.round(lines.reduce((s, l) => s + l.amountExVat, 0) * 100) / 100;
}

export type PriceSnapshot = {
  lines: { name: string; qty: number; unitPriceExVat: number; lineExVat: number }[];
  extras: ExtraLine[];
  extrasExVat: number;
  goodsExVat: number;
  amountExVat: number;
  vatAmount: number;
  amountIncVat: number;
  lockedAt: string;
};

export function buildPriceSnapshot(input: {
  lines: { name: string; qty: number; unitPriceExVat: number }[];
  extras: ExtraLine[];
}): PriceSnapshot {
  const lines = input.lines.map((l) => ({
    ...l,
    lineExVat: Math.round(l.unitPriceExVat * l.qty * 100) / 100,
  }));
  const goodsExVat = Math.round(lines.reduce((s, l) => s + l.lineExVat, 0) * 100) / 100;
  const extrasExVat = extrasTotal(input.extras);
  const amountExVat = Math.round((goodsExVat + extrasExVat) * 100) / 100;
  const vatAmount = Math.round(amountExVat * 0.25 * 100) / 100;
  return {
    lines,
    extras: input.extras,
    extrasExVat,
    goodsExVat,
    amountExVat,
    vatAmount,
    amountIncVat: Math.round((amountExVat + vatAmount) * 100) / 100,
    lockedAt: new Date().toISOString(),
  };
}

export function parseSnapshot(raw?: string | null): PriceSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PriceSnapshot;
  } catch {
    return null;
  }
}
