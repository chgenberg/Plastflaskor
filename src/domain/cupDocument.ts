import { z } from "zod";

export const cupDocumentSchema = z.object({
  version: z.literal(1).default(1),
  productSlug: z.string(),
  variantSku: z.string().optional(),
  quantity: z.number().int().min(1),
  wrap: z.object({
    widthMm: z.number().positive().default(220),
    heightMm: z.number().positive().default(90),
    bleedMm: z.number().nonnegative().default(3),
  }).default({ widthMm: 220, heightMm: 90, bleedMm: 3 }),
  options: z.object({
    wall: z.enum(["enkel", "dubbel"]).default("enkel"),
    eco: z.boolean().default(false),
    finish: z.enum(["matte", "glossy"]).default("matte"),
    lid: z.enum(["none", "white", "black"]).default("none"),
  }),
  layers: z.array(z.record(z.string(), z.unknown())).default([]),
  requirements: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      placed: z.boolean().default(false),
      required: z.boolean().default(true),
    }),
  ).default([]),
});

export type CupDocument = z.infer<typeof cupDocumentSchema>;

export function parseCupDocument(raw: string | null | undefined): CupDocument | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = cupDocumentSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Studio canvasJson layers. Missing, empty, or non-array → null. */
export function parseStudioCanvasJson(raw: string): { layers: Record<string, unknown>[] } | null {
  try {
    const parsed = JSON.parse(raw) as { layers?: unknown };
    if (!Array.isArray(parsed.layers) || parsed.layers.length === 0) return null;
    return { layers: parsed.layers as Record<string, unknown>[] };
  } catch {
    return null;
  }
}

export function emptyCupDocument(input: {
  productSlug: string;
  quantity: number;
  variantSku?: string;
  wall?: "enkel" | "dubbel";
  eco?: boolean;
  finish?: "matte" | "glossy";
  lid?: "none" | "white" | "black";
  wrap?: { widthMm?: number; heightMm?: number; bleedMm?: number };
  layers?: CupDocument["layers"];
  requirements?: CupDocument["requirements"];
}): CupDocument {
  return cupDocumentSchema.parse({
    version: 1,
    productSlug: input.productSlug,
    variantSku: input.variantSku,
    quantity: input.quantity,
    wrap: input.wrap,
    options: {
      wall: input.wall ?? "enkel",
      eco: input.eco ?? false,
      finish: input.finish ?? "matte",
      lid: input.lid ?? "none",
    },
    layers: input.layers ?? [],
    requirements: input.requirements ?? [],
  });
}

export const REQUIRED_PRINT_MESSAGE =
  "Placera obligatoriska etikettelement innan du går vidare.";

export function printGate(requirements: { required?: boolean; placed?: boolean }[] | null | undefined) {
  const required = (requirements ?? []).filter((r) => r.required === true);
  const done = required.filter((r) => r.placed === true).length;
  return { done, total: required.length, ready: required.length === 0 || done === required.length };
}

export function assertRequiredPrintPlaced(
  requirements: { required?: boolean; placed?: boolean }[] | null | undefined,
) {
  if (!printGate(requirements).ready) {
    throw new Error(REQUIRED_PRINT_MESSAGE);
  }
}
