import { requireRole } from "@/server/rbac";
import { parseCupOptions } from "@/domain/cupCatalog";
import { listCupProducts, getPriceListForBuyer } from "@/server/services/catalog.service";
import { prisma } from "@/server/db";
import { CupOrderForm } from "@/ui/order/CupOrderForm";
import { PageHeader, Panel } from "@/ui/shell/primitives";

export default async function NewCustomerOrder() {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const products = await listCupProducts();
  const list = user.customerId ? await getPriceListForBuyer({ customerId: user.customerId }) : null;
  const addresses = user.customerId
    ? await prisma.address.findMany({ where: { customerId: user.customerId } })
    : [];
  const variants = products.flatMap((p) =>
    p.variants.map((v) => {
      const opt = parseCupOptions(v.optionsJson);
      return {
        id: v.id,
        name: v.name,
        productName: p.name,
        moq: p.moq,
        volumeMl: v.volumeMl,
        wall: opt.wall,
        eco: Boolean(opt.eco),
        leadTimeDays: p.leadTimeDays,
        tiers: (list?.items ?? [])
          .filter((i) => i.variantId === v.id)
          .map((i) => ({ minQty: i.minQty, unitPriceExVat: i.unitPriceExVat })),
      };
    }),
  );
  return (
    <div className="space-y-8">
      <PageHeader title="Ny order" subtitle="Preliminärt leveransdatum räknas från produktens ledtid. Aqua bekräftar slutdatum." />
      <Panel>
        <CupOrderForm variants={variants} addresses={addresses} />
      </Panel>
    </div>
  );
}
