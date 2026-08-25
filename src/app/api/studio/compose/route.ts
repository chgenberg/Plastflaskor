import { z } from "zod";
import { composeLabelFromAssets } from "@/server/services/composeLabel.service";
import { RealityPreviewError } from "@/server/services/openaiImage";

export const maxDuration = 120;

const metaSchema = z.object({
  productName: z.string().min(1),
  categorySlug: z.string().min(1),
});

async function fileBuffer(value: FormDataEntryValue | null) {
  if (!(value instanceof Blob) || value.size < 32) return undefined;
  if (value.size > 8_000_000) throw new RealityPreviewError("Bilden är för stor.", 413);
  return Buffer.from(await value.arrayBuffer());
}

export async function POST(req: Request) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return Response.json({ error: "Bilder saknas." }, { status: 400 });
    }

    const parsed = metaSchema.safeParse(JSON.parse(String(form.get("meta") ?? "{}")));
    if (!parsed.success) {
      return Response.json({ error: "Ogiltiga produktuppgifter." }, { status: 400 });
    }

    const result = await composeLabelFromAssets({
      logo: await fileBuffer(form.get("logo")),
      background: await fileBuffer(form.get("background")),
      productName: parsed.data.productName,
      categorySlug: parsed.data.categorySlug,
    });
    return Response.json(result);
  } catch (err) {
    if (err instanceof RealityPreviewError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Kunde inte skapa etiketten.";
    return Response.json({ error: message }, { status: 502 });
  }
}
