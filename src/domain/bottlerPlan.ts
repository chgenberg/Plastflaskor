export type PlanSize = "33" | "50";
export type PlanWater = "stilla" | "kolsyrat" | "citron";
export type PlanCap = "svart" | "vit" | "bla" | "rod";

export const PLAN_SIZES: { id: PlanSize; label: string }[] = [
  { id: "33", label: "33 cl" },
  { id: "50", label: "50 cl" },
];
export const PLAN_WATERS: { id: PlanWater; label: string }[] = [
  { id: "stilla", label: "Stilla" },
  { id: "kolsyrat", label: "Kolsyrat" },
  { id: "citron", label: "Citron" },
];
export const PLAN_CAPS: { id: PlanCap; label: string }[] = [
  { id: "svart", label: "Svart kork" },
  { id: "vit", label: "Vit kork" },
  { id: "bla", label: "Blå kork" },
  { id: "rod", label: "Röd kork" },
];

function readJson(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function planSize(volumeMl?: number | null): PlanSize {
  return volumeMl && volumeMl >= 400 ? "50" : "33";
}

export function planWater(input: { visualSpecJson?: string | null; optionsJson?: string | null; productName?: string }): PlanWater {
  const blob = `${input.productName ?? ""} ${JSON.stringify(readJson(input.visualSpecJson))} ${JSON.stringify(readJson(input.optionsJson))}`.toLowerCase();
  if (blob.includes("citron") || blob.includes("lemon")) return "citron";
  if (blob.includes("kolsyr")) return "kolsyrat";
  const spec = readJson(input.visualSpecJson);
  const opt = readJson(input.optionsJson);
  const water = String(spec.waterType ?? opt.waterType ?? "").toLowerCase();
  if (water.includes("kolsyr")) return "kolsyrat";
  if (water.includes("citron")) return "citron";
  return "stilla";
}

export function planCap(input: { visualSpecJson?: string | null; optionsJson?: string | null }): PlanCap {
  const spec = readJson(input.visualSpecJson);
  const opt = readJson(input.optionsJson);
  const raw = String(spec.cap ?? opt.cap ?? opt.capColor ?? "").toLowerCase();
  if (raw.includes("vit") || raw.includes("white")) return "vit";
  if (raw.includes("blå") || raw.includes("bla") || raw.includes("blue")) return "bla";
  if (raw.includes("röd") || raw.includes("rod") || raw.includes("red")) return "rod";
  return "svart";
}

export function planFromItem(input: {
  volumeMl?: number | null;
  visualSpecJson?: string | null;
  optionsJson?: string | null;
  productName?: string;
}) {
  return {
    size: planSize(input.volumeMl),
    water: planWater(input),
    cap: planCap(input),
  };
}

export function planLabels(plan: { size: PlanSize; water: PlanWater; cap: PlanCap }) {
  return {
    size: PLAN_SIZES.find((s) => s.id === plan.size)?.label ?? `${plan.size} cl`,
    water: PLAN_WATERS.find((s) => s.id === plan.water)?.label ?? plan.water,
    cap: PLAN_CAPS.find((s) => s.id === plan.cap)?.label ?? plan.cap,
  };
}
