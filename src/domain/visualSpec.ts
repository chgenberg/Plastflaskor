import { bottleColorLabel, capLabel, parseBottleOptions, waterTypeLabel } from "./bottleCatalog";

export type VisualSpec = {
  productName: string;
  qty: number;
  volumeLabel: string;
  waterType: string;
  bottleColor: string;
  cap: string;
  imageSrc?: string | null;
  /** @deprecated cup leftover — ignored in UI */
  wall?: string;
  eco?: boolean;
  finish?: string;
  lid?: string;
};

export function visualSpecFromOptions(input: {
  productName: string;
  qty: number;
  volumeMl?: number | null;
  optionsJson?: string | null;
  imageSrc?: string | null;
}): VisualSpec {
  const opt = parseBottleOptions(input.optionsJson);
  const cl = input.volumeMl ? `${Math.round(input.volumeMl / 10)} CL` : "";
  return {
    productName: input.productName,
    qty: input.qty,
    volumeLabel: cl,
    waterType: waterTypeLabel(opt.waterType),
    bottleColor: bottleColorLabel(opt.color),
    cap: capLabel(opt.cap),
    imageSrc: input.imageSrc,
  };
}

export function specFromOrderItem(input: {
  visualSpecJson?: string | null;
  item?: {
    qty: number;
    visualSpecJson?: string | null;
    variant: { volumeMl: number | null; optionsJson: string; product: { name: string; slug: string } };
  } | null;
  imageSrc?: string | null;
}): VisualSpec | null {
  const parsed = parseVisualSpec(input.visualSpecJson) ?? parseVisualSpec(input.item?.visualSpecJson);
  if (parsed) return { ...parsed, imageSrc: parsed.imageSrc ?? input.imageSrc };
  const item = input.item;
  if (!item) return null;
  return visualSpecFromOptions({
    productName: item.variant.product.name,
    qty: item.qty,
    volumeMl: item.variant.volumeMl,
    optionsJson: item.variant.optionsJson,
    imageSrc: input.imageSrc,
  });
}

export function parseVisualSpec(raw?: string | null): VisualSpec | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as VisualSpec;
    if (!v.productName) return null;
    if (!v.waterType && (v.wall || v.lid)) {
      return {
        ...v,
        waterType: v.waterType ?? "STILLA",
        bottleColor: v.bottleColor ?? "TRANSPARENT FLASKA",
        cap: v.cap ?? "SVART KAPSYL",
      };
    }
    return {
      ...v,
      waterType: v.waterType ?? "STILLA",
      bottleColor: v.bottleColor ?? "TRANSPARENT FLASKA",
      cap: v.cap ?? "SVART KAPSYL",
    };
  } catch {
    return null;
  }
}
