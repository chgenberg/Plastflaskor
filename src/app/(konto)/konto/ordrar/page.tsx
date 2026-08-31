import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { listOrdersForCustomer } from "@/server/services/order.service";
import { BUYER_STATUS } from "@/domain/enums";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { BuyerOrderCard } from "@/ui/order/BuyerOrderCard";
import { EmptyState, LinkButton, PageHeader } from "@/ui/shell/primitives";

const DONE = new Set(["DELIVERED", "INVOICED", "PAID"]);

export default async function KontoOrders({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: raw } = await searchParams;
  const view = raw === "delivered" || raw === "active" || raw === "proof" || raw === "shipped" ? raw : "all";
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const all = user.customerId ? await listOrdersForCustomer(user.customerId) : [];
  const orders =
    view === "active"
      ? all.filter((o) => !DONE.has(o.currentStatus))
      : view === "delivered"
        ? all.filter((o) => DONE.has(o.currentStatus))
        : view === "proof"
          ? all.filter((o) => o.currentStatus === "ARTWORK_CUSTOMER_APPROVAL")
          : view === "shipped"
            ? all.filter((o) => o.currentStatus === "SHIPPED")
            : all;
  return (
    <div className="space-y-8">
      <PageHeader title="Ordrar" action={<LinkButton href="/konto/ordrar/ny">Ny order</LinkButton>} />
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { id: "all", label: "Alla", href: "/konto/ordrar" },
          { id: "active", label: "Aktiva", href: "/konto/ordrar?view=active" },
          { id: "proof", label: "Väntar på godkännande", href: "/konto/ordrar?view=proof" },
          { id: "shipped", label: "På väg", href: "/konto/ordrar?view=shipped" },
          { id: "delivered", label: "Levererade / tidigare", href: "/konto/ordrar?view=delivered" },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`rounded-[var(--av-radius-md)] px-3 py-1.5 ${view === tab.id ? "bg-[var(--av-accent-soft)] font-medium text-[var(--av-accent)]" : "text-[var(--av-text-muted)]"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
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
