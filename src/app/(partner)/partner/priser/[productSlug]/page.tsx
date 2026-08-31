import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getPricesForReseller, getProductBySlug, resolveUnitPrice } from "@/server/services/catalog.service";
import { DataRow, DataTable, EmptyState, LinkButton, PageHeader, Panel } from "@/ui/shell/primitives";

const QTYS = [500, 1000, 2500, 5000];

export default async function PartnerProductPrice({ params }: { params: Promise<{ productSlug: string }> }) {
  const { productSlug } = await params;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const product = await getProductBySlug(productSlug);
  if (!product) notFound();
  if (!user.resellerId) {
    return (
      <div className="space-y-8">
        <PageHeader title={product.name} />
        <EmptyState title="Ingen prislista kopplad" body="Logga in som återförsäljare för att se nettopris." />
      </div>
    );
  }
  const list = await getPricesForReseller(user.resellerId);
  const items = list?.items.filter((i) => i.variant.product.slug === productSlug) ?? [];
  if (!items.length) {
    return (
      <div className="space-y-8">
        <PageHeader title={product.name} subtitle="Ingen rad på er lista." />
        <EmptyState title="Saknas i prislistan" body="Kontakta Aqua Visibility om produkten ska finnas på er lista." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={product.name}
        subtitle={`${list?.name} · ${list?.code}`}
        action={<LinkButton href={`/designa/${product.slug}`}>Designa / Beställ</LinkButton>}
      />
      <p className="text-sm">
        <Link href="/partner/priser" className="text-[var(--av-accent)]">
          ← Alla priser
        </Link>
      </p>
      <Panel padded={false}>
        <DataTable
          headers={[
            { label: "Variant" },
            ...QTYS.map((n) => ({ label: `${n} st`, align: "right" as const })),
          ]}
        >
          {product.variants.map((variant) => (
            <DataRow key={variant.id}>
              <td className="px-5 py-3">{variant.name}</td>
              {QTYS.map((n) => {
                const price = resolveUnitPrice(items, variant.id, n);
                return (
                  <td key={n} className="px-5 py-3 text-right tabular-nums">
                    {price ? `${price.unitPriceExVat.toFixed(2)} kr` : "–"}
                  </td>
                );
              })}
            </DataRow>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
