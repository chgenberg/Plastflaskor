import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { getSessionUser } from "@/server/rbac";
import { listAllOrders } from "@/server/services/order.service";
import { getFortnoxConnection } from "@/server/integrations/status";
import { markInvoicePaid } from "@/actions";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { Button, EmptyState, KpiCard, LinkButton, PageHeader, SectionTitle, StatusChip } from "@/ui/shell/primitives";
import { FortnoxBadge } from "@/ui/shell/FortnoxBadge";

const CARD = "av-card p-5";

export default async function FinancePage() {
  const user = await getSessionUser();
  const fortnox = getFortnoxConnection();
  const orders = await listAllOrders();
  const ready = orders.filter((o) => o.currentStatus === "READY_TO_INVOICE" || o.currentStatus === "DELIVERED");
  const invoiced = orders.filter((o) => o.invoice && o.invoice.status === "ISSUED");
  const waiting = invoiced.filter((o) => o.invoice?.status !== "PAID");
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const invoicedWeek = orders.filter((o) => o.invoice?.issuedAt && o.invoice.issuedAt >= weekStart);
  const isAdmin = user?.role === "AQUA_ADMIN";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fakturering"
        subtitle="Redo att fakturera, utfärdade och väntar betalning."
        action={<FortnoxBadge label={fortnox.label} />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Redo att faktureras" value={ready.length} />
        <KpiCard label="Fakturerade" value={invoiced.length} />
        <KpiCard label="Fakturerade denna vecka" value={invoicedWeek.length} />
        <KpiCard label="Väntar betalning" value={waiting.length} />
      </div>
      {ready.length === 0 ? (
        <EmptyState title="Inget att fakturera" body="När en order är levererad eller redo för faktura syns den här." />
      ) : (
        <section className="space-y-4">
          <SectionTitle>Redo att faktureras</SectionTitle>
          {ready.map((o) => {
            const value = o.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
            const item = o.items[0];
            const spec = specFromOrderItem({
              visualSpecJson: o.visualSpecJson,
              item,
              imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
            });
            return (
              <article key={o.id} className={CARD}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-medium">{o.orderNo}</p>
                    <p className="mt-0.5 text-sm text-[var(--av-text-muted)]">{o.reseller?.company.name ?? o.customer.name}</p>
                  </div>
                  <StatusChip
                    status={o.currentStatus}
                    label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                    requestedDate={o.requestedDate}
                  />
                </div>
                {spec ? (
                  <div className="mt-4">
                    <VisualSpecCard spec={spec} compact />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[var(--av-text-muted)]">
                    {item?.qty} × {item?.variant.product.name}
                  </p>
                )}
                <p className="mt-4 text-sm tabular-nums text-[var(--av-text-muted)]">{value.toLocaleString("sv-SE")} kr</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <LinkButton href={`/operations/ordrar/${o.orderNo}`} variant="secondary">
                    Öppna
                  </LinkButton>
                  <LinkButton href={`/operations/ekonomi/${o.orderNo}/fakturera`}>Fakturera</LinkButton>
                </div>
              </article>
            );
          })}
        </section>
      )}
      {waiting.length === 0 ? null : (
        <section className="space-y-4">
          <SectionTitle>Väntar betalning</SectionTitle>
          {waiting.map((o) => {
            const value = o.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
            const item = o.items[0];
            const spec = specFromOrderItem({
              visualSpecJson: o.visualSpecJson,
              item,
              imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
            });
            return (
              <article key={o.id} className={CARD}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-medium">{o.invoice?.invoiceNo ?? o.orderNo}</p>
                    <p className="mt-0.5 text-sm text-[var(--av-text-muted)]">{o.reseller?.company.name ?? o.customer.name}</p>
                    <p className="mt-0.5 font-mono text-sm text-[var(--av-text-muted)]">{o.orderNo}</p>
                  </div>
                  <StatusChip
                    status={o.currentStatus}
                    label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                    requestedDate={o.requestedDate}
                  />
                </div>
                {spec ? (
                  <div className="mt-4">
                    <VisualSpecCard spec={spec} dense />
                  </div>
                ) : null}
                <p className="mt-4 text-sm tabular-nums text-[var(--av-text-muted)]">{value.toLocaleString("sv-SE")} kr</p>
                {o.invoice ? (
                  <div className="mt-2">
                    <FortnoxBadge label={fortnox.label} invoiceNo={o.invoice.invoiceNo} fortnoxId={o.invoice.fortnoxId} />
                  </div>
                ) : null}
                <div className="mt-4">
                  {isAdmin && o.invoice ? (
                    <form action={markInvoicePaid}>
                      <input type="hidden" name="invoiceNo" value={o.invoice.invoiceNo} />
                      <Button type="submit" variant="secondary">
                        Markera betald
                      </Button>
                    </form>
                  ) : (
                    <span className="text-sm text-[var(--av-text-muted)]">Väntar</span>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
