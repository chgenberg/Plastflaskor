import { requireRole } from "@/server/rbac";
import { listOrdersForCustomer } from "@/server/services/order.service";
import { BUYER_STATUS } from "@/domain/enums";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { BuyerOrderCard } from "@/ui/order/BuyerOrderCard";
import { EmptyState, LinkButton, PageHeader } from "@/ui/shell/primitives";

export default async function KontoOrders() {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.customerId ? await listOrdersForCustomer(user.customerId) : [];
  return (
    <div className="space-y-8">
      <PageHeader title="Ordrar" action={<LinkButton href="/konto/ordrar/ny">Ny order</LinkButton>} />
      {orders.length === 0 ? (
        <EmptyState title="Inga ordrar" body="När ni skickar en order syns den här." />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const item = o.items[0];
            const spec = specFromOrderItem({
              visualSpecJson: o.visualSpecJson,
              item,
              imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
            });
            const delivery = o.aquaApprovedDelivery
              ? `Leverans ${o.aquaApprovedDelivery}`
              : o.preliminaryDate
                ? `Preliminärt ${o.preliminaryDate}`
                : null;
            return (
              <BuyerOrderCard
                key={o.id}
                href={`/konto/ordrar/${o.orderNo}`}
                orderNo={o.orderNo}
                spec={spec}
                status={o.currentStatus}
                statusLabel={BUYER_STATUS[o.currentStatus]}
                delivery={delivery}
                actionHref={o.lockedAt ? `/konto/ordrar/${o.orderNo}/repeat` : null}
                actionLabel={o.lockedAt ? "Beställ igen" : null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
