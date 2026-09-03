import { z } from "zod";

export const WATER_KINDS = ["stilla", "kolsyrat", "lime"] as const;
export type WaterKind = (typeof WATER_KINDS)[number];

export const bottleOptionsSchema = z.object({
  waterType: z.enum(["stilla", "kolsyrat"]),
  cap: z.enum(["skruvkork", "sportkork", "black", "white"]).optional(),
  color: z.enum(["transparent", "frost", "black"]).optional(),
});

export type BottleOptions = z.infer<typeof bottleOptionsSchema>;

export function parseWaterKind(raw: unknown): WaterKind {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("lime") || s.includes("citron")) return "lime";
  if (s.includes("kolsyr")) return "kolsyrat";
  return "stilla";
}

export function waterKindFromOptionsJson(optionsJson?: string | null): WaterKind {
  try {
    const raw = JSON.parse(optionsJson || "{}") as Record<string, unknown>;
    return parseWaterKind(raw.waterType);
  } catch {
    return "stilla";
  }
}

export function waterTypeForOrder(kind: WaterKind): "stilla" | "kolsyrat" {
  return kind === "stilla" ? "stilla" : "kolsyrat";
}

export function parseBottleOptions(optionsJson?: string | null): BottleOptions {
  try {
    const raw = JSON.parse(optionsJson || "{}") as Record<string, unknown>;
    const kind = parseWaterKind(raw.waterType);
    const water = kind === "stilla" ? "stilla" : "kolsyrat";
    const cap =
      raw.cap === "sportkork" || raw.cap === "sport"
        ? "sportkork"
        : raw.cap === "white"
          ? "white"
          : raw.cap === "black"
            ? "black"
            : "skruvkork";
    const color = raw.color === "frost" || raw.color === "black" ? raw.color : "transparent";
    return bottleOptionsSchema.parse({ waterType: water, cap, color });
  } catch {
    return { waterType: "stilla", cap: "skruvkork", color: "transparent" };
  }
}

export function waterTypeLabel(value?: string | null) {
  if (value === "lime" || value === "CITRON/LIME") return "CITRON/LIME";
  return value === "kolsyrat" || value === "KOLSYRAT" ? "KOLSYRAT" : "STILLA";
}

export function waterKindLabel(kind: WaterKind) {
  if (kind === "lime") return "Citron/lime";
  if (kind === "kolsyrat") return "Kolsyrat";
  return "Stilla";
}

export function capLabel(value?: string | null) {
  if (value === "sportkork" || value === "sport") return "SPORTKORK";
  if (value === "skruvkork" || value === "skruv" || !value) return "SKRUVKORK";
  if (value === "white") return "VIT KAPSYL";
  if (value === "black") return "SVART KAPSYL";
  return "SKRUVKORK";
}

export function bottleColorLabel(value?: string | null) {
  if (value === "frost") return "FROSTAD FLASKA";
  if (value === "black") return "SVART FLASKA";
  return "TRANSPARENT FLASKA";
}

/** Butikstext. Versaler i capLabel/bottleColorLabel är för visual spec. */
export function capShopLabel(value?: string | null) {
  if (value === "sportkork" || value === "sport") return "Sportkork";
  if (value === "white") return "Vit kapsyl";
  if (value === "black") return "Svart kapsyl";
  return "Skruvkork";
}

export function bottleColorShopLabel(value?: string | null) {
  if (value === "frost") return "Frostad";
  if (value === "black") return "Svart";
  return "Transparent";
}

export function labelSpecForVolume(volumeMl?: number | null) {
  const cl = volumeMl ? Math.round(volumeMl / 10) : 33;
  return {
    format: cl >= 50 ? "Wrap 210 × 90 mm" : "Wrap 170 × 80 mm",
    material: "Vattentålig PP",
  };
}

/** Vit eller transparent etikett. Standard är vit om inget annat är satt. */
export function labelStockLabel(input: { visualSpecJson?: string | null; optionsJson?: string | null }) {
  const raw = readLabelStock(input.visualSpecJson) ?? readLabelStock(input.optionsJson);
  if (!raw) return "Vit";
  const s = raw.toLowerCase();
  if (s.includes("transp")) return "Transparent";
  if (s.includes("vit") || s.includes("white") || s.includes("papper") || s.includes("paper")) return "Vit";
  return "Vit";
}

function readLabelStock(json?: string | null) {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as Record<string, unknown>;
    const raw = v.labelMaterial ?? v.labelKind ?? v.labelStock;
    return typeof raw === "string" ? raw : null;
  } catch {
    return null;
  }
}

export function formatShipAddress(addr?: { line1: string; postalCode: string; city: string } | null) {
  if (!addr) return null;
  return `${addr.line1}, ${addr.postalCode} ${addr.city}`;
}

export const LABEL_REQUIREMENTS = [
  { code: "product_name", label: "Produktnamn", required: true },
  { code: "volume", label: "Volym", required: true },
  { code: "ean", label: "EAN", required: true },
  { code: "pant", label: "Pant", required: true },
  { code: "producer", label: "Producent", required: true },
  { code: "ingredients", label: "Ingredienser / produktinformation", required: true },
  { code: "mandatory", label: "Obligatorisk information", required: true },
] as const;
