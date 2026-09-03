import { waterKindFromOptionsJson, waterTypeForOrder } from "@/domain/bottleCatalog";
import { listWaterProducts } from "@/server/services/catalog.service";
import { getLatestStudioDraft } from "@/server/services/document.service";
import { getSessionUser } from "@/server/rbac";
import { Studio } from "@/ui/studio/Studio";
import { wrapForVolume } from "@/ui/studio/engine/types";

export default async function DesignPage() {
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
      role={user?.role}
      latestDraft={latestDraft}
    />
  );
}
