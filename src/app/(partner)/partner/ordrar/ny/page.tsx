import { requireRole } from "@/server/rbac";
import { parseCupOptions } from "@/domain/cupCatalog";
import { listCupProducts, getPriceListForBuyer } from "@/server/services/catalog.service";
import { prisma } from "@/server/db";
import { CupOrderForm } from "@/ui/order/CupOrderForm";
import { PageHeader, Panel } from "@/ui/shell/primitives";

export default async function PartnerNewOrder() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const products = await listCupProducts();
  const list = user.resellerId ? await getPriceListForBuyer({ resellerId: user.resellerId }) : null;
  const reseller = user.resellerId
    ? await prisma.reseller.findUnique({
        where: { id: user.resellerId },
        include: { customers: true, company: { include: { addresses: true } } },
      })
    : null;
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
      <PageHeader title="Ny order" subtitle="Beställ pappersmuggar åt en av era kunder. Preliminärt datum bekräftas av Aqua." />
      <Panel>
        <CupOrderForm
          variants={variants}
          addresses={reseller?.company.addresses ?? []}
          customers={reseller?.customers ?? []}
          showCustomerSelect
        />
      </Panel>
    </div>
  );
}
