import { readFile } from "node:fs/promises";
import path from "node:path";
import OpenAI, { toFile, APIError } from "openai";
import { imageForProduct } from "@/domain/productImages";
import { buildRealityPrompt, type RealityMeta } from "@/domain/realityPreview";

export class RealityPreviewError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "RealityPreviewError";
  }
}

function productPhotoPath(slug: string) {
  const rel = imageForProduct(slug);
  if (!rel) return null;
  return path.join(process.cwd(), "public", rel.replace(/^\//, ""));
}

export async function generateRealityPreview(labelPng: Buffer, meta: RealityMeta) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new RealityPreviewError("Lägg OPENAI_API_KEY i .env för att se produkten i verkligheten.", 503);
  }

  const prompt = buildRealityPrompt(meta);
  const client = new OpenAI({ apiKey });

  const images = [
    await toFile(labelPng, "label.png", { type: "image/png" }),
  ];

  const photo = productPhotoPath(meta.productSlug);
  if (photo) {
    try {
      images.push(await toFile(await readFile(photo), "product.png", { type: "image/png" }));
    } catch {
      /* generate from label + prompt only */
    }
  }

  let response;
  try {
    response = await client.images.edit({
      model: "gpt-image-2",
      image: images,
      prompt,
      size: "1024x1536",
      quality: "high",
    });
  } catch (err) {
    if (err instanceof APIError) {
      if (err.status === 401) throw new RealityPreviewError("Ogiltig OPENAI_API_KEY.", 401);
      if (err.status === 429) throw new RealityPreviewError("För många bilder just nu. Vänta en stund och försök igen.", 429);
      throw new RealityPreviewError(err.message || "GPT Image 2 kunde inte skapa bilden.", err.status ?? 502);
    }
    throw err;
  }

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new RealityPreviewError("GPT Image 2 lämnade ingen bild. Försök igen.", 502);
  }

  return {
    imageDataUrl: `data:image/png;base64,${b64}`,
  };
}
