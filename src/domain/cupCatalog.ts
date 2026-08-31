import { z } from "zod";

export const cupOptionsSchema = z.object({
  wall: z.enum(["enkel", "dubbel"]),
  eco: z.boolean().optional(),
  finish: z.enum(["matte", "glossy"]).optional(),
  lid: z.enum(["none", "white", "black"]).optional(),
});

export type CupOptions = z.infer<typeof cupOptionsSchema>;

export function parseCupOptions(optionsJson?: string | null): CupOptions {
  try {
    const raw = JSON.parse(optionsJson || "{}") as Record<string, unknown>;
    return cupOptionsSchema.parse({
      wall: raw.wall === "dubbel" ? "dubbel" : "enkel",
      eco: raw.eco === "ja" || raw.eco === true,
      finish: raw.finish === "glossy" ? "glossy" : "matte",
      lid: raw.lid === "white" || raw.lid === "black" ? raw.lid : "none",
    });
  } catch {
    return { wall: "enkel", eco: false, finish: "matte", lid: "none" };
  }
}
