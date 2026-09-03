export type StudioProduct = {
  id: string;
  slug: string;
  name: string;
  moq: number;
  categorySlug: string;
  volumeMl?: number | null;
  variantSku?: string;
  wrap?: { widthMm: number; heightMm: number; bleedMm: number };
  printRequirements?: { code: string; label: string; required: boolean }[];
  variants?: { sku: string; water: "stilla" | "kolsyrat" }[];
};

export function wrapForVolume(volumeMl?: number | null) {
  if (volumeMl && volumeMl <= 120) return { widthMm: 170, heightMm: 62, bleedMm: 3 };
  if (volumeMl && volumeMl >= 350) return { widthMm: 260, heightMm: 110, bleedMm: 3 };
  return { widthMm: 220, heightMm: 90, bleedMm: 3 };
}

export type LayerType = "artwork" | "logo" | "text" | "qr";

export type Layer = {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipX?: boolean;
  fit?: "cover" | "contain";
  align?: "left" | "center" | "right";
  src?: string;
  text?: string;
  color?: string;
};

export type StudioDraft = {
  id: string;
  projectName: string;
  productId: string;
  canvasJson: string;
  optionsJson: string;
  cupDocumentJson?: string;
};

export type StudioPane = "add" | "layers" | "bottle" | "reqs";

export type Finish = "matte" | "gloss";

export const LABEL_GRAY = "#e5e7eb";

export function defaultLayers(): Layer[] {
  return [
    {
      id: "artwork",
      type: "artwork",
      name: "Etikett",
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
    },
    {
      id: "logo",
      type: "logo",
      name: "Logotyp",
      x: 50,
      y: 46,
      scale: 1,
      rotation: 0,
    },
    {
      id: "text",
      type: "text",
      name: "Text",
      x: 50,
      y: 70,
      scale: 1,
      rotation: 0,
      text: "",
      color: "#1d1d1f",
    },
    {
      id: "qr",
      type: "qr",
      name: "QR-kod",
      x: 82,
      y: 82,
      scale: 0.7,
      rotation: 0,
      text: "",
    },
  ];
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeLayers(raw: unknown): Layer[] {
  const defaults = defaultLayers();
  if (!Array.isArray(raw)) return defaults;
  return defaults.map((base) => {
    const found = raw.find((item) => item && typeof item === "object" && (item as Layer).id === base.id);
    if (!found || typeof found !== "object") return base;
    const patch = found as Partial<Layer>;
    return {
      ...base,
      ...patch,
      id: base.id,
      type: base.type,
      name: typeof patch.name === "string" ? patch.name : base.name,
      x: asNumber(patch.x, base.x),
      y: asNumber(patch.y, base.y),
      scale: asNumber(patch.scale, base.scale),
      rotation: asNumber(patch.rotation, base.rotation),
    };
  });
}

export function parseStudioCanvas(raw: string): { layers: Layer[]; finish?: Finish; printFiles: string[] } {
  try {
    const parsed = JSON.parse(raw) as { layers?: unknown; finish?: Finish; printFiles?: unknown };
    return {
      layers: normalizeLayers(parsed.layers),
      finish: parsed.finish === "gloss" || parsed.finish === "matte" ? parsed.finish : undefined,
      printFiles: Array.isArray(parsed.printFiles) ? parsed.printFiles.filter((n): n is string => typeof n === "string") : [],
    };
  } catch {
    return { layers: defaultLayers(), printFiles: [] };
  }
}

export function skuLabel(p: StudioProduct) {
  const ml = p.volumeMl;
  const volume = ml
    ? ml % 10 === 0 && ml >= 100
      ? `${ml / 10} cl`
      : `${ml} ml`
    : "—";
  const short = p.name.split("–")[0].replace(/\s+\d+\s*cl.*$/i, "").trim();
  return short && volume !== "—" ? `${volume} · ${short}` : volume;
}

export function shapeFor(categorySlug: string): "bottle" | "can" | "cup" | "sport" | "cooler" {
  if (categorySlug === "energidryck") return "can";
  if (categorySlug === "pappersmuggar") return "cup";
  if (categorySlug === "sportflaskor") return "sport";
  if (categorySlug === "kyl") return "cooler";
  return "bottle";
}
