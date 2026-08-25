import OpenAI, { toFile, APIError } from "openai";
import { RealityPreviewError } from "./realityPreview.service";

export async function composeLabelFromAssets(input: {
  logo?: Buffer;
  background?: Buffer;
  productName: string;
  categorySlug: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new RealityPreviewError("Lägg OPENAI_API_KEY i .env för att skapa etiketten.", 503);
  }
  if (!input.logo && !input.background) {
    throw new RealityPreviewError("Ladda upp logotyp eller bakgrund.", 400);
  }

  const prompt = [
    "Create a print-ready wraparound beverage label, 16:9 landscape, commercial packaging design.",
    `Product: ${input.productName} (${input.categorySlug}).`,
    input.background
      ? "IMAGE of the background/motif: use it as the full-bleed label field. Keep the motif recognizable. Refine lighting and print texture. Do not crop away the main subject."
      : "No customer background was provided. Use a clean light gray #e5e7eb field with subtle paper fiber. No extra scenery.",
    input.logo
      ? "IMAGE of the brand logo: place this exact logo centered on the label. Preserve colors, wordmark and proportions. Do not redraw, restyle, or invent extra marks."
      : "No logo was provided. Leave the center empty. Do not invent a logo or Aqua Visibility wordmark.",
    "No barcodes, no prices, no extra text, no watermark, no collage borders.",
  ].join("\n");

  const client = new OpenAI({ apiKey });
  const images = [];
  if (input.background) images.push(await toFile(input.background, "background.png", { type: "image/png" }));
  if (input.logo) images.push(await toFile(input.logo, "logo.png", { type: "image/png" }));

  let response;
  try {
    response = await client.images.edit({
      model: "gpt-image-2",
      image: images,
      prompt,
      size: "1536x1024",
      quality: "high",
    });
  } catch (err) {
    if (err instanceof APIError) {
      if (err.status === 401) throw new RealityPreviewError("Ogiltig OPENAI_API_KEY.", 401);
      if (err.status === 429) throw new RealityPreviewError("För många bilder just nu. Vänta en stund och försök igen.", 429);
      throw new RealityPreviewError(err.message || "GPT Image 2 kunde inte skapa etiketten.", err.status ?? 502);
    }
    throw err;
  }

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new RealityPreviewError("GPT Image 2 lämnade ingen bild. Försök igen.", 502);
  }

  return { imageDataUrl: `data:image/png;base64,${b64}` };
}
