import { waterKindFromOptionsJson, waterTypeForOrder } from "@/domain/bottleCatalog";
import { listWaterProducts } from "@/server/services/catalog.service";
import { getLatestStudioDraft } from "@/server/services/document.service";
import { getSessionUser } from "@/server/rbac";
import { Studio } from "@/ui/studio/Studio";
import { wrapForVolume } from "@/ui/studio/engine/types";

const STUDIO_SLUG_ALIAS: Record<string, string> = {
  "stenkulla-33": "vatten-fran-svensk-kalla-33cl",
  "stenkulla-33cl": "vatten-fran-svensk-kalla-33cl",
};

export default async function DesignProductPage({ params }: { params: Promise<{ product: string }> }) {
  const { product: raw } = await params;
  const product = STUDIO_SLUG_ALIAS[raw] ?? raw;
  const products = await listWaterProducts();
  const user = await getSessionUser();
  const latestDraft = user ? await getLatestStudioDraft(user) : null;
  return (
    <Studio
      products={products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        moq: p.moq,
        categorySlug: p.categorySlug,
        volumeMl: p.variants[0]?.volumeMl ?? null,
        variantSku: p.variants[0]?.sku,
        wrap: wrapForVolume(p.variants[0]?.volumeMl),
        printRequirements: p.printRequirements,
        variants: p.variants.map((v) => ({
          sku: v.sku,
          water: waterTypeForOrder(waterKindFromOptionsJson(v.optionsJson)),
        })),
      }))}
      initialSlug={product}
      role={user?.role}
      latestDraft={latestDraft}
    />
  );
}
