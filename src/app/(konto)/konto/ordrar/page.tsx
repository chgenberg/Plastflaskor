import { requireRole } from "@/server/rbac";
import { listOrdersForCustomer } from "@/server/services/order.service";
import { BUYER_STATUS } from "@/domain/enums";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { BuyerOrderTable } from "@/ui/order/BuyerOrderCard";
import { findKontoOrder, kontoPeekHref, KontoOrderPeek } from "@/ui/order/KontoOrderPeek";
import { DashPage, EmptyState, FilterChip, LinkButton, PageHeader } from "@/ui/shell/primitives";

const DONE = new Set(["DELIVERED", "INVOICED", "PAID"]);

export default async function KontoOrders({ searchParams }: { searchParams: Promise<{ view?: string; order?: string }> }) {
  const { view: raw, order: peekNo } = await searchParams;
  const view = raw === "delivered" || raw === "active" || raw === "proof" || raw === "shipped" ? raw : "all";
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const all = user.customerId ? await listOrdersForCustomer(user.customerId) : [];
  const closeHref = view === "all" ? "/konto/ordrar" : `/konto/ordrar?view=${view}`;
  const peek = findKontoOrder(all, peekNo);
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
    <DashPage>
      <PageHeader title="Ordrar" action={<LinkButton href="/konto/ordrar/ny">Ny order</LinkButton>} />
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: "all", label: "Alla", href: "/konto/ordrar" },
          { id: "active", label: "Aktiva", href: "/konto/ordrar?view=active" },
          { id: "proof", label: "Väntar på godkännande", href: "/konto/ordrar?view=proof" },
          { id: "shipped", label: "På väg", href: "/konto/ordrar?view=shipped" },
          { id: "delivered", label: "Levererade / tidigare", href: "/konto/ordrar?view=delivered" },
        ].map((tab) => (
          <FilterChip key={tab.id} href={tab.href} active={view === tab.id}>
            {tab.label}
          </FilterChip>
        ))}
      </div>
      {orders.length === 0 ? (
        <EmptyState title="Inga ordrar" body="När ni skickar en order syns den här." />
      ) : (
        <BuyerOrderTable
          rows={orders.map((o) => {
            const item = o.items[0];
            return {
              href: kontoPeekHref("/konto/ordrar", o.orderNo, view === "all" ? undefined : { view }),
              orderNo: o.orderNo,
              spec: specFromOrderItem({
                visualSpecJson: o.visualSpecJson,
                item,
                imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
              }),
              status: o.currentStatus,
              statusLabel: BUYER_STATUS[o.currentStatus],
              delivery: o.aquaApprovedDelivery
                ? `Leverans ${o.aquaApprovedDelivery}`
                : o.preliminaryDate
                  ? `Preliminärt ${o.preliminaryDate}`
                  : null,
              actionHref: o.lockedAt ? `/konto/ordrar/${o.orderNo}/repeat` : null,
              actionLabel: o.lockedAt ? "Beställ igen" : null,
            };
          })}
        />
      )}
      {peek ? <KontoOrderPeek order={peek} role={user.role} closeHref={closeHref} /> : null}
    </DashPage>
  );
}
