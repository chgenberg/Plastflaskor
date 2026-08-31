import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { prisma } from "@/server/db";
import { shipmentTrackingSteps } from "@/domain/orderBrief";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { EmptyState, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";

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
          visualSpecJson: true,
          items: {
            select: {
              qty: true,
              visualSpecJson: true,
              variant: {
                select: {
                  volumeMl: true,
                  optionsJson: true,
                  product: { select: { name: true, slug: true } },
                },
              },
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
        <div className="grid gap-4">
          {shipments.map((s) => {
            const steps = shipmentTrackingSteps(s.status);
            const current = steps.find((st) => st.current);
            const item = s.order.items[0];
            const spec = specFromOrderItem({
              visualSpecJson: s.order.visualSpecJson,
              item,
              imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
            });
            return (
              <Panel key={s.id}>
                {spec ? (
                  <div className="mb-5">
                    <VisualSpecCard spec={spec} compact />
                  </div>
                ) : null}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="av-label">Order</p>
                    <p className="mt-1 font-mono text-lg font-semibold">{s.order.orderNo}</p>
                  </div>
                  <StatusChip status={s.status} label={current?.label ?? "Skapad"} />
                </div>
                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="av-label">Transportör</dt>
                    <dd className="mt-1 font-medium">{s.carrier}</dd>
                  </div>
                  <div>
                    <dt className="av-label">Spårning</dt>
                    <dd className="mt-1 font-mono text-[var(--av-text-muted)]">{s.trackingNo}</dd>
                  </div>
                </dl>
                <ol className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {steps.map((st) => (
                    <li key={st.id} className={st.current ? "font-semibold" : st.done ? "font-medium" : "text-[var(--av-text-muted)]"}>
                      {st.label}
                    </li>
                  ))}
                </ol>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
