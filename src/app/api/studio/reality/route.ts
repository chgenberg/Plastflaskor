import { z } from "zod";
import { generateRealityPreview, RealityPreviewError } from "@/server/services/realityPreview.service";

export const maxDuration = 120;

const metaSchema = z.object({
  productSlug: z.string().min(1),
  productName: z.string().min(1),
  categorySlug: z.string().min(1),
  volumeMl: z.number().nullable().optional(),
  water: z.string(),
  cap: z.string(),
  labelKind: z.string(),
  finish: z.enum(["matte", "gloss"]),
  projectName: z.string(),
  extraText: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return Response.json({ error: "Tryckytan saknas." }, { status: 400 });
    }
    const file = form.get("label");
    if (!(file instanceof Blob) || file.size < 32) {
      return Response.json({ error: "Tryckytan saknas." }, { status: 400 });
    }
    if (file.size > 8_000_000) {
      return Response.json({ error: "Tryckytan är för stor." }, { status: 413 });
    }

    const parsed = metaSchema.safeParse(JSON.parse(String(form.get("meta") ?? "{}")));
    if (!parsed.success) {
      return Response.json({ error: "Ogiltiga produktuppgifter." }, { status: 400 });
    }

    const labelPng = Buffer.from(await file.arrayBuffer());
    const result = await generateRealityPreview(labelPng, parsed.data);
    return Response.json(result);
  } catch (err) {
    if (err instanceof RealityPreviewError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Kunde inte skapa bilden.";
    return Response.json({ error: message }, { status: 502 });
  }
}
