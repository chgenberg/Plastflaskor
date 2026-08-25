import { listProducts } from "@/server/services/catalog.service";
import { getSessionUser } from "@/server/rbac";
import { Studio } from "@/ui/studio/Studio";

export default async function DesignProductPage({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  const products = await listProducts();
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
      }))}
      initialSlug={product}
      role={user?.role}
    />
  );
}
