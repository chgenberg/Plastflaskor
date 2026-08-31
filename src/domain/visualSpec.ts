export type VisualSpec = {
  productName: string;
  qty: number;
  volumeLabel: string;
  wall: string;
  eco: boolean;
  finish: string;
  lid: string;
  imageSrc?: string | null;
};

export function visualSpecFromOptions(input: {
  productName: string;
  qty: number;
  volumeMl?: number | null;
  optionsJson?: string | null;
  imageSrc?: string | null;
}): VisualSpec {
  const opt = safeJson(input.optionsJson);
  const wall = opt.wall === "dubbel" ? "Dubbelvägg" : "Enkelvägg";
  const eco = opt.eco === "ja" || opt.eco === true || opt.eco === "true";
  const finish = opt.finish === "glossy" ? "Glans" : "Matt";
  const lid =
    opt.lid === "white" ? "Vitt lock" : opt.lid === "black" ? "Svart lock" : "Utan lock";
  const cl = input.volumeMl ? `${Math.round(input.volumeMl / 10)} cl` : "";
  return {
    productName: input.productName,
    qty: input.qty,
    volumeLabel: cl,
    wall,
    eco,
    finish,
    lid,
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
    return v;
  } catch {
    return null;
  }
}

function safeJson(raw?: string | null): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}
