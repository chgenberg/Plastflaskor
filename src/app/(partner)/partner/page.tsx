import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { BUYER_STATUS } from "@/domain/enums";
import { buyerNextAction } from "@/domain/orderBrief";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { BuyerOrderCard } from "@/ui/order/BuyerOrderCard";
import { EmptyState, KpiCard, LinkButton, NextStep, PageHeader } from "@/ui/shell/primitives";

export default async function PartnerHome() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const resellerId = user.resellerId;
  const firstName = user.name?.split(" ")[0] ?? "där";
  const orders = resellerId ? await listOrdersForReseller(resellerId) : [];
  const active = orders.filter((o) => !["PAID", "DELIVERED", "INVOICED"].includes(o.currentStatus)).length;
  const proof = orders.filter((o) => o.currentStatus === "ARTWORK_CUSTOMER_APPROVAL").length;
  const shipped = orders.filter((o) => o.currentStatus === "SHIPPED").length;
  const invoices = orders.filter((o) => o.invoice).length;
  const next = buyerNextAction(orders);

  if (!resellerId) {
    return (
      <div className="space-y-8">
        <PageHeader title={`Hej ${firstName}`} subtitle="ÅF-portalen visar ordrar för en kopplad återförsäljare." />
        <EmptyState title="Ingen återförsäljare kopplad" body="Det här kontot har ingen prislista eller orderhistorik. Logga in som ÅF för att se ordrar och priser." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hej ${firstName}`}
        subtitle="Ordrar, korrektur och leveranser för er lista."
        action={<LinkButton href="/partner/ordrar/ny">Ny order</LinkButton>}
      />
      <NextStep
        title={next.title}
        body={next.body}
        href={`/partner${next.hrefSuffix}`}
        cta={next.cta}
        tone={proof > 0 ? "next" : "done"}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Aktiva ordrar" value={active} href="/partner/ordrar" />
        <KpiCard label="Väntar på korrektur" value={proof} href="/partner/ordrar" />
        <KpiCard label="På väg" value={shipped} href="/partner/ordrar" />
        <KpiCard label="Fakturor" value={invoices} href="/partner/fakturor" />
      </div>
      {orders.length === 0 ? (
        <EmptyState title="Inga ordrar ännu" body="När du lägger en order syns den här. Starta i studion eller beställ från prislistan." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
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
                href={`/partner/ordrar/${o.orderNo}`}
                orderNo={o.orderNo}
                spec={spec}
                status={o.currentStatus}
                statusLabel={BUYER_STATUS[o.currentStatus]}
                delivery={delivery}
                customer={o.customer.name}
                actionHref={o.lockedAt ? `/partner/ordrar/${o.orderNo}/repeat` : null}
                actionLabel={o.lockedAt ? "Beställ igen" : null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
