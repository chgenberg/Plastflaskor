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
  src?: string;
  text?: string;
  color?: string;
};

export type Tool = "design" | "text" | "upload" | "colors" | "bottle" | "preview";

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

export function skuLabel(p: StudioProduct) {
  const ml = p.volumeMl;
  const volume = ml
    ? ml % 10 === 0 && ml >= 100
      ? `${ml / 10} cl`
      : `${ml} ml`
    : "—";
  return volume;
}

export function shapeFor(categorySlug: string): "bottle" | "can" | "cup" | "sport" | "cooler" {
  if (categorySlug === "energidryck") return "can";
  if (categorySlug === "pappersmuggar") return "cup";
  if (categorySlug === "sportflaskor") return "sport";
  if (categorySlug === "kyl") return "cooler";
  return "bottle";
}
