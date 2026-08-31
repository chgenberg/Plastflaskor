/** Product shots from Nano Banana 2. Only these slugs stay public. */
export const PRODUCT_IMAGES: Record<string, string> = {
  "naturligt-mineralvatten-33cl": "/Images/pages/valmojligheter-antal.png",
  "naturligt-mineralvatten-50cl": "/Images/pages/valmojligheter-antal.png",
  "vatten-fran-svensk-kalla-33cl": "/Images/pages/valmojligheter-etikett.png",
  "energidryck-med-egen-etikett": "/Images/products/energidryck-med-egen-etikett.png",
  "lask-med-egen-etikett": "/Images/products/lask-med-egen-etikett.png",
  "pappersmugg-ev-23cl": "/Images/products/pappersmugg-ev-23cl.png",
  "pappersmugg-dv-35cl": "/Images/products/pappersmugg-dv-35cl.png",
  aquarefill: "/Images/products/aquarefill.png",
  "shiva-bio-tacx-500ml": "/Images/products/shiva-bio.png",
  "shiva-bio-tacx-750ml": "/Images/products/shiva-bio.png",
  "profilerbar-kyl": "/Images/products/profilerbar-kyl.png",
};

export const PUBLIC_PRODUCT_SLUGS = Object.keys(PRODUCT_IMAGES);

export function imageForProduct(slug: string) {
  return PRODUCT_IMAGES[slug] ?? null;
}
