import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { listOrdersForCustomer } from "@/server/services/order.service";
import { BUYER_STATUS } from "@/domain/enums";
import { buyerNextAction } from "@/domain/orderBrief";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { BuyerOrderCard } from "@/ui/order/BuyerOrderCard";
import { EmptyState, KpiCard, LinkButton, NextStep, PageHeader } from "@/ui/shell/primitives";

export default async function KontoHome() {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.customerId ? await listOrdersForCustomer(user.customerId) : [];
  const active = orders.filter((o) => !["PAID", "DELIVERED", "INVOICED"].includes(o.currentStatus)).length;
  const proof = orders.filter((o) => o.currentStatus === "ARTWORK_CUSTOMER_APPROVAL").length;
  const shipped = orders.filter((o) => o.currentStatus === "SHIPPED").length;
  const invoices = orders.filter((o) => o.invoice).length;
  const next = buyerNextAction(orders);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hej ${user.name?.split(" ")[0] ?? ""}`}
        subtitle="Status, godkännande och fakturor."
        action={<LinkButton href="/konto/ordrar/ny">Ny order</LinkButton>}
      />
      <NextStep
        title={next.title}
        body={next.body}
        href={`/konto${next.hrefSuffix}`}
        cta={next.cta}
        tone={proof > 0 ? "next" : "done"}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Aktiva ordrar" value={active} href="/konto/ordrar?view=active" />
        <KpiCard label="Väntar på ditt godkännande" value={proof} href="/konto/ordrar?view=proof" />
        <KpiCard label="På väg" value={shipped} href="/konto/ordrar?view=shipped" />
        <KpiCard label="Fakturor" value={invoices} href="/konto/fakturor" />
      </div>
      {orders.length === 0 ? (
        <EmptyState title="Inga ordrar ännu" body="Skapa en ny order eller beställ igen från en tidigare order." />
      ) : (
        <div className="flex flex-col gap-1.5">
          {orders.slice(0, 6).map((o) => {
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
      <p className="text-sm text-[var(--av-text-muted)]">
        Behöver ni en etikett? <Link href="/designa" className="font-medium text-[var(--av-accent)]">Öppna designern</Link>
      </p>
    </div>
  );
}
