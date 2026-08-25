import OpenAI, { toFile, APIError } from "openai";

export class RealityPreviewError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "RealityPreviewError";
  }
}

export type ImageInput = { bytes: Buffer; name: string };

function mapOpenAiError(err: APIError) {
  const text = (err.message || "").toLowerCase();
  if (err.status === 401) return new RealityPreviewError("Ogiltig OPENAI_API_KEY.", 401);
  if (err.status === 429) return new RealityPreviewError("För många bilder just nu. Vänta en stund och försök igen.", 429);
  if (text.includes("verification") || text.includes("verified")) {
    return new RealityPreviewError("OpenAI-kontot måste verifieras för GPT Image.", 403);
  }
  if (text.includes("billing") || text.includes("quota") || text.includes("insufficient")) {
    return new RealityPreviewError("OpenAI-kontot saknar kredit för bildgenerering.", 402);
  }
  return new RealityPreviewError(err.message || "GPT Image kunde inte skapa bilden.", err.status ?? 502);
}

export function requireOpenAiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new RealityPreviewError("OPENAI_API_KEY saknas. Lägg nyckeln i Railway Variables.", 503);
  }
  return apiKey;
}

export async function generateWithReferences(input: {
  prompt: string;
  images: ImageInput[];
  size: "1024x1024" | "1536x1024" | "1024x1536";
}) {
  const client = new OpenAI({ apiKey: requireOpenAiKey() });
  const files = await Promise.all(input.images.map((img) => toFile(img.bytes, img.name, { type: "image/png" })));

  const models = ["gpt-image-2", "gpt-image-1"] as const;
  let last: unknown;
  for (const model of models) {
    try {
      const response = await client.images.edit({
        model,
        image: files.length === 1 ? files[0] : files,
        prompt: input.prompt,
        size: input.size,
        quality: "medium",
      });
      const b64 = response.data?.[0]?.b64_json;
      if (!b64) throw new RealityPreviewError("GPT Image lämnade ingen bild. Försök igen.", 502);
      return { imageDataUrl: `data:image/png;base64,${b64}` };
    } catch (err) {
      last = err;
      if (err instanceof RealityPreviewError) throw err;
      if (err instanceof APIError && err.status === 400 && /model|invalid value/i.test(err.message)) continue;
      if (err instanceof APIError) throw mapOpenAiError(err);
      throw err;
    }
  }
  if (last instanceof APIError) throw mapOpenAiError(last);
  throw last instanceof Error ? last : new RealityPreviewError("GPT Image kunde inte skapa bilden.", 502);
}
