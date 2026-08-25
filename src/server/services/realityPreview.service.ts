import { readFile } from "node:fs/promises";
import path from "node:path";
import { imageForProduct } from "@/domain/productImages";
import { buildRealityPrompt, type RealityMeta } from "@/domain/realityPreview";
import { generateWithReferences, RealityPreviewError } from "./openaiImage";

export { RealityPreviewError };

function productPhotoPath(slug: string) {
  const rel = imageForProduct(slug);
  if (!rel) return null;
  return path.join(process.cwd(), "public", rel.replace(/^\//, ""));
}

export async function generateRealityPreview(labelPng: Buffer, meta: RealityMeta) {
  const images = [{ bytes: labelPng, name: "label.png" }];
  const photo = productPhotoPath(meta.productSlug);
  if (photo) {
    try {
      images.push({ bytes: await readFile(photo), name: "product.png" });
    } catch {
      /* generate from label + prompt only */
    }
  }

  return generateWithReferences({
    prompt: buildRealityPrompt(meta),
    images,
    size: "1024x1536",
  });
}
