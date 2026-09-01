import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { prisma } from "@/server/db";
import { shipmentTrackingSteps } from "@/domain/orderBrief";
import { DashList, DashRow, EmptyState, PageHeader, StatusChip } from "@/ui/shell/primitives";

export default async function BottlerShippedPage() {
  const user = await requireSupplier("bottler");
  const factoryId = scopedFactoryId(user);
  if ((user.role === "BOTTLER" || user.role === "FACTORY") && !user.factoryId) {
    return (
      <div className="space-y-8">
        <PageHeader title="Skickat" />
        <EmptyState title="Ingen bottler kopplad" body="Logga in som bottler för att se skickade flaskor." />
      </div>
    );
  }
  const shipments = await prisma.shipment.findMany({
    where: {
      type: "GOODS_TO_CUSTOMER",
      ...(factoryId ? { order: { factoryId } } : {}),
      OR: [{ status: { in: ["PICKED_UP", "IN_TRANSIT", "DELIVERED"] } }, { shippedAt: { not: null } }],
    },
    include: {
      order: {
        select: {
          orderNo: true,
          items: {
            select: {
              qty: true,
              variant: { select: { product: { select: { name: true } } } },
            },
          },
        },
      },
    },
    orderBy: { shippedAt: "desc" },
  });
  return (
    <div className="space-y-8">
      <PageHeader title="Skickat" subtitle="Sändningar från bottler." />
      {shipments.length === 0 ? (
        <EmptyState title="Inga flaskor skickade" body="När ett jobb markeras som skickat syns sändningen här." />
      ) : (
        <DashList>
          {shipments.map((s) => {
            const steps = shipmentTrackingSteps(s.status);
            const current = steps.find((st) => st.current);
            const item = s.order.items[0];
            return (
              <DashRow
                key={s.id}
                primary={s.order.orderNo}
                columns={[
                  item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–",
                  s.carrier,
                  s.trackingNo ?? "–",
                ]}
                status={<StatusChip status={s.status} label={current?.label ?? "Skapad"} />}
              />
            );
          })}
        </DashList>
      )}
    </div>
  );
}
