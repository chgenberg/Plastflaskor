export type StudioProduct = {
  id: string;
  slug: string;
  name: string;
  moq: number;
  categorySlug: string;
  volumeMl?: number | null;
};

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

export const EXAMPLE_LOGO = "/brand/aqua-visibility-logo.png";
export const LABEL_GRAY = "#e5e7eb";

export function defaultLayers(): Layer[] {
  return [
    {
      id: "artwork",
      type: "artwork",
      name: "Bakgrund",
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
      src: EXAMPLE_LOGO,
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
  const pack =
    p.categorySlug === "pappersmuggar"
      ? "Kartong"
      : p.categorySlug === "energidryck"
        ? "Aluminium"
        : p.categorySlug === "kyl"
          ? "Kyl"
          : p.categorySlug === "sportflaskor"
            ? "Sport PET"
            : p.categorySlug === "lask-must"
              ? "PET"
              : "Klar PET";
  return `${volume} // ${pack}`;
}

export function shapeFor(categorySlug: string): "bottle" | "can" | "cup" | "sport" | "cooler" {
  if (categorySlug === "energidryck") return "can";
  if (categorySlug === "pappersmuggar") return "cup";
  if (categorySlug === "sportflaskor") return "sport";
  if (categorySlug === "kyl") return "cooler";
  return "bottle";
}
