export type RealityFinish = "matte" | "gloss";

export type RealityMeta = {
  productSlug: string;
  productName: string;
  categorySlug: string;
  volumeMl?: number | null;
  water: string;
  cap: string;
  labelKind: string;
  finish: RealityFinish;
  projectName: string;
  extraText?: string;
};

const PRODUCT_BODY: Record<string, string> = {
  "naturligt-mineralvatten-33cl":
    "Slim 33 cl clear PET mineral-water bottle. Photoreal PET, not glass. Cold condensation. Petaloid base visible.",
  "naturligt-mineralvatten-50cl":
    "Taller 50 cl clear PET mineral-water bottle. Photoreal PET shoulder and recycling-feel plastic, not glass.",
  "vatten-fran-svensk-kalla-33cl":
    "33 cl clear PET bottle with a slightly more refined silhouette. Must read as PET, not glass.",
  "lask-med-egen-etikett":
    "50 cl clear PET soft-drink bottle, petaloid base, colored liquid that is muted not neon.",
  "julmust-med-egen-etikett":
    "50 cl PET bottle filled with dark traditional Swedish julmust. Same bottle family as the läsk.",
  "energidryck-med-egen-etikett":
    "Slim 25 cl aluminum can, photoreal metal seam and rim. One can only.",
  "pappersmugg-eco-ev-12cl":
    "Small 12 cl / 4 oz single-wall matte compostable paper cup, espresso size, thin wall clearly visible.",
  "pappersmugg-ev-23cl":
    "23 cl single-wall matte paper cup, standard coffee size, thinner wall than double-wall.",
  "pappersmugg-eco-ev-23cl":
    "23 cl single-wall compostable cup, matte uncoated board, slightly warmer kraft-cream tone.",
  "pappersmugg-dv-23cl":
    "23 cl double-wall paper cup, visibly thicker rim and double-wall seam.",
  "pappersmugg-eco-dv-23cl":
    "23 cl double-wall compostable cup, thick rim, matte uncoated FSC board.",
  "pappersmugg-dv-35cl":
    "Larger 35 cl / 12 oz double-wall paper cup, clearly taller than 23 cl.",
  "pappersmugg-eco-dv-35cl":
    "35 cl double-wall compostable cup, tall, matte uncoated board.",
  aquarefill:
    "75 cl Swedish sports bottle, slightly sculpted body, matte recycled plastic, push-pull sport cap. Wide wraparound printed area. Not a generic cylinder.",
  "shiva-bio-tacx-500ml":
    "Classic Shiva/Tacx-style 500 ml cycling bottle, matte bio-polyethylene, triangular grip cap, lockable push-pull.",
  "shiva-bio-tacx-750ml":
    "Same Shiva Bio family, clearly taller 750 ml body, triangular grip cap.",
  "shiva-green-tacx-500ml":
    "Classic Shiva 500 ml, sugarcane plastic with a faint plant-based warmth (not bright green), triangular cap.",
  "shiva-green-tacx-750ml":
    "Matching Shiva Green 750 ml, taller body, triangular cap.",
  "profilerbar-kyl":
    "Compact impulse cooler, cream lid slightly open, ice inside. The cooler is the hero; design sits on the front panel, not as a floating sticker.",
};

function categoryFallback(categorySlug: string, volumeMl?: number | null) {
  const vol = volumeMl
    ? volumeMl % 10 === 0 && volumeMl >= 100
      ? `${volumeMl / 10} cl`
      : `${volumeMl} ml`
    : "";
  if (categorySlug === "energidryck") return `Slim ${vol || "25 cl"} aluminum energy-drink can.`;
  if (categorySlug === "pappersmuggar") return `${vol || "23 cl"} paper cup, photoreal uncoated board.`;
  if (categorySlug === "sportflaskor") return `${vol || "75 cl"} sports bottle with sport cap.`;
  if (categorySlug === "kyl") return "Compact branded impulse cooler.";
  if (categorySlug === "lask-must") return `${vol || "50 cl"} clear PET soft-drink bottle.`;
  return `${vol || "50 cl"} clear PET beverage bottle. Photoreal PET, not glass.`;
}

function waterLine(water: string, categorySlug: string) {
  if (categorySlug === "pappersmuggar" || categorySlug === "kyl" || categorySlug === "sportflaskor") return "";
  if (water === "kolsyrat") return "Liquid is sparkling: fine rising bubbles, lively meniscus.";
  return "Liquid is still spring water, calm, no bubbles.";
}

function capLine(cap: string, categorySlug: string) {
  if (categorySlug === "energidryck" || categorySlug === "pappersmuggar" || categorySlug === "kyl") return "";
  if (cap === "sportkork") return "Sport / push-pull cap, not a plain screw cap.";
  return "Standard black screw cap unless the product body specifies otherwise.";
}

function labelLine(labelKind: string, finish: RealityFinish, categorySlug: string) {
  if (categorySlug === "kyl") {
    return finish === "gloss"
      ? "Printed front panel with a soft gloss varnish."
      : "Printed front panel, matte uncoated feel.";
  }
  if (labelKind === "transparent") {
    return finish === "gloss"
      ? "Clear film wraparound label, glossy, artwork sits on the bottle with see-through unprinted areas."
      : "Clear film wraparound label, satin, artwork sits on the bottle with see-through unprinted areas.";
  }
  return finish === "gloss"
    ? "Physical wraparound paper label with a light gloss varnish, slight paper thickness and edge."
    : "Physical wraparound uncoated paper label, matte fiber, slight paper thickness and a visible paper edge.";
}

export function buildRealityPrompt(meta: RealityMeta) {
  const body = PRODUCT_BODY[meta.productSlug] ?? categoryFallback(meta.categorySlug, meta.volumeMl);
  const extra = meta.extraText?.trim();

  return [
    "Apply the customer's exact label artwork onto a real physical product. This is a commercial product photograph, not a mockup overlay.",
    "",
    "IMAGE 1 is the exact 2D label artwork, shown flat and unwrapped. Print THIS artwork onto the product. Preserve colors, composition, logo, crop and any text exactly. Do not invent extra logos, do not rewrite text, do not add a barcode, do not add Aqua Visibility branding unless it is already in the artwork.",
    "IMAGE 2 if present is the product form, material, lighting and scene to match. Keep the same camera, lens feel and environment. Replace only the printed area with Image 1.",
    "",
    "PRODUCT",
    `- Name: ${meta.productName}`,
    `- Body: ${body}`,
    waterLine(meta.water, meta.categorySlug),
    capLine(meta.cap, meta.categorySlug),
    `- Print: ${labelLine(meta.labelKind, meta.finish, meta.categorySlug)}`,
    extra ? `- Customer text on the label: “${extra}”` : "",
    meta.projectName && !/aqua visibility/i.test(meta.projectName) ? `- Project: ${meta.projectName}` : "",
    "",
    "LOOK",
    "Hyperrealistic commercial product photograph for a Scandinavian B2B beverage brand. 85mm lens, f/2.8. Soft overcast daylight from camera-left, no beauty dish, no hard flash. Kodak Portra 400: warm paper, cool greens, restrained saturation. Palette #F5F5F7, birch, charcoal, forest pine, clear PET, matte aluminum, uncoated board. Subtle film grain. Full product visible with generous margin — top, body and base all in frame. Three-quarter view, 4:5.",
    "",
    "The label must look physically printed and wrapped: it follows the cylinder (or cup/can/cooler panel) with correct perspective, slight compression at the edges, contact shadows, and lighting that matches the product. Not a floating rectangle. Not a transparent billboard. Not a flat sticker hovering in front of the bottle. Not CGI plastic shine.",
    "",
    "NEGATIVES",
    "no extra logos, no fake Aqua Visibility wordmark, no barcodes in focus, no prices, no watermark, no text overlay outside the label, no neon, no CGI, no collage, no cropped cap or base.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
