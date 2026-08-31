import { listWaterProducts } from "@/server/services/catalog.service";
import { getSessionUser } from "@/server/rbac";
import { Studio } from "@/ui/studio/Studio";
import { wrapForVolume } from "@/ui/studio/engine/types";

export default async function DesignPage() {
  const products = await listWaterProducts();
  const user = await getSessionUser();
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
      }))}
      role={user?.role}
    />
  );
}
