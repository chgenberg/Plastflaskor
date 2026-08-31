import { requireRole } from "@/server/rbac";
import { parseBottleOptions } from "@/domain/bottleCatalog";
import { listWaterProducts, getPriceListForBuyer } from "@/server/services/catalog.service";
import { prisma } from "@/server/db";
import { BottleOrderForm } from "@/ui/order/BottleOrderForm";
import { PageHeader, Panel } from "@/ui/shell/primitives";

export default async function NewCustomerOrder({ searchParams }: { searchParams: Promise<{ design?: string }> }) {
  const { design: designId } = await searchParams;
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const products = await listWaterProducts();
  const list = user.customerId ? await getPriceListForBuyer({ customerId: user.customerId }) : null;
  const addresses = user.customerId
    ? await prisma.address.findMany({ where: { customerId: user.customerId } })
    : [];
  const design = designId
    ? await prisma.design.findFirst({
        where: {
          id: designId,
          ...(user.role === "CUSTOMER" && user.id ? { userId: user.id } : {}),
        },
      })
    : null;
  const designOpt = design ? parseBottleOptions(design.optionsJson) : null;
  const variants = products.flatMap((p) =>
    p.variants.map((v) => {
      const opt = parseBottleOptions(v.optionsJson);
      return {
        id: v.id,
        name: v.name,
        productId: p.id,
        productName: p.name,
        moq: p.moq,
        volumeMl: v.volumeMl,
        waterType: opt.waterType,
        cap: opt.cap ?? "skruvkork",
        color: opt.color ?? "transparent",
        leadTimeDays: p.leadTimeDays,
        tiers: (list?.items ?? [])
          .filter((i) => i.variantId === v.id)
          .map((i) => ({ minQty: i.minQty, unitPriceExVat: i.unitPriceExVat })),
      };
    }),
  );
  return (
    <div className="space-y-8">
      <PageHeader title="Ny order" subtitle="Profilvatten — preliminärt leveransdatum räknas från produktens ledtid. Aqua bekräftar slutdatum." />
      <Panel>
        <BottleOrderForm
          variants={variants}
          addresses={addresses}
          fromDesign={
            design && designOpt
              ? {
                  designId: design.id,
                  projectName: design.projectName,
                  productId: design.productId,
                  qty: design.quantity,
                  waterType: designOpt.waterType,
                  cap: designOpt.cap ?? "skruvkork",
                  color: designOpt.color ?? "transparent",
                }
              : null
          }
        />
      </Panel>
    </div>
  );
}
