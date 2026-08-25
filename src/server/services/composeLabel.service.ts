import { generateWithReferences, RealityPreviewError } from "./openaiImage";

export async function composeLabelFromAssets(input: {
  logo?: Buffer;
  background?: Buffer;
  productName: string;
  categorySlug: string;
}) {
  if (!input.logo && !input.background) {
    throw new RealityPreviewError("Ladda upp logotyp eller bakgrund.", 400);
  }

  const prompt = [
    "Create a print-ready wraparound beverage label, 16:9 landscape, commercial packaging design.",
    `Product: ${input.productName} (${input.categorySlug}).`,
    input.background
      ? "The background/motif image is a reference. Use it as the full-bleed label field. Keep the motif recognizable."
      : "No customer background was provided. Use a clean light gray #e5e7eb field with subtle paper fiber.",
    input.logo
      ? "The logo image is a reference. Place this exact logo centered. Preserve colors, wordmark and proportions. Do not redraw or invent marks."
      : "No logo was provided. Leave the center empty. Do not invent a logo.",
    "No barcodes, no prices, no extra text, no watermark, no collage borders.",
  ].join("\n");

  const images = [];
  if (input.background) images.push({ bytes: input.background, name: "background.png" });
  if (input.logo) images.push({ bytes: input.logo, name: "logo.png" });

  return generateWithReferences({ prompt, images, size: "1536x1024" });
}
