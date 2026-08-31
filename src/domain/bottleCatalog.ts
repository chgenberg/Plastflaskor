import { z } from "zod";

export const bottleOptionsSchema = z.object({
  waterType: z.enum(["stilla", "kolsyrat"]),
  cap: z.enum(["skruvkork", "sportkork", "black", "white"]).optional(),
  color: z.enum(["transparent", "frost", "black"]).optional(),
});

export type BottleOptions = z.infer<typeof bottleOptionsSchema>;

export function parseBottleOptions(optionsJson?: string | null): BottleOptions {
  try {
    const raw = JSON.parse(optionsJson || "{}") as Record<string, unknown>;
    const water =
      raw.waterType === "kolsyrat" || raw.waterType === "kolsyra" || String(raw.waterType).includes("kolsyr")
        ? "kolsyrat"
        : "stilla";
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
  return value === "kolsyrat" || value === "KOLSYRAT" ? "KOLSYRAT" : "STILLA";
}

export function capLabel(value?: string | null) {
  if (value === "sportkork" || value === "sport") return "SPORTKORK";
  if (value === "white") return "VIT KAPSYL";
  if (value === "black") return "SVART KAPSYL";
  return "SVART KAPSYL";
}

export function bottleColorLabel(value?: string | null) {
  if (value === "frost") return "FROSTAD FLASKA";
  if (value === "black") return "SVART FLASKA";
  return "TRANSPARENT FLASKA";
}

export function labelSpecForVolume(volumeMl?: number | null) {
  const cl = volumeMl ? Math.round(volumeMl / 10) : 33;
  return {
    format: cl >= 50 ? "Wrap 210 × 90 mm" : "Wrap 170 × 80 mm",
    material: "Vattentålig PP",
  };
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
