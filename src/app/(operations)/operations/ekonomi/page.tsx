import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { getSessionUser } from "@/server/rbac";
import { listAllOrders, orderValue } from "@/server/services/order.service";
import { getFortnoxConnection } from "@/server/integrations/status";
import { markInvoicePaid } from "@/actions";
import { Button, DashList, DashRow, EmptyState, KpiCard, LinkButton, PageHeader, SectionTitle, StatusChip } from "@/ui/shell/primitives";
import { FortnoxBadge } from "@/ui/shell/FortnoxBadge";

export default async function FinancePage() {
  const user = await getSessionUser();
  const fortnox = getFortnoxConnection();
  const orders = await listAllOrders();
  const ready = orders.filter((o) => o.currentStatus === "READY_TO_INVOICE" || o.currentStatus === "DELIVERED");
  const invoiced = orders.filter((o) => o.invoice && o.invoice.status === "ISSUED");
  const waiting = invoiced.filter((o) => o.invoice?.status !== "PAID");
  const isAdmin = user?.role === "AQUA_ADMIN";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fakturering"
        subtitle="Redo att fakturera, utfärdade och väntar betalning."
        action={<FortnoxBadge label={fortnox.label} />}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Redo att faktureras" value={ready.length} />
        <KpiCard label="Väntar betalning" value={waiting.length} />
      </div>
      {ready.length === 0 ? (
        <EmptyState title="Inget att fakturera" body="När en order är levererad eller redo för faktura syns den här." />
      ) : (
        <section className="space-y-3">
          <SectionTitle>Redo att faktureras</SectionTitle>
          <DashList>
          {ready.map((o) => {
            const value = orderValue(o);
            const item = o.items[0];
            return (
              <DashRow
                key={o.id}
                primary={o.orderNo}
                primaryHref={`/operations/ordrar/${o.orderNo}`}
                columns={[
                  o.customer.name,
                  item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–",
                  `${value.toLocaleString("sv-SE")} kr`,
                ]}
                status={
                  <StatusChip
                    status={o.currentStatus}
                    label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                    requestedDate={o.requestedDate}
                  />
                }
                actions={
                  <>
                    <LinkButton href={`/operations/ordrar/${o.orderNo}`} variant="secondary" size="sm">
                      Öppna
                    </LinkButton>
                    <LinkButton href={`/operations/ekonomi/${o.orderNo}/fakturera`} size="sm">
                      Fakturera
                    </LinkButton>
                  </>
                }
              />
            );
          })}
          </DashList>
        </section>
      )}
      {waiting.length === 0 ? null : (
        <section className="space-y-3">
          <SectionTitle>Väntar betalning</SectionTitle>
          <DashList>
          {waiting.map((o) => {
            const value = orderValue(o);
            const item = o.items[0];
            return (
              <DashRow
                key={o.id}
                primary={o.invoice?.invoiceNo ?? o.orderNo}
                primaryHref={`/operations/ordrar/${o.orderNo}`}
                columns={[
                  o.customer.name,
                  o.orderNo,
                  item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–",
                  `${value.toLocaleString("sv-SE")} kr`,
                ]}
                status={
                  <StatusChip
                    status={o.currentStatus}
                    label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                    requestedDate={o.requestedDate}
                  />
                }
                actions={
                  isAdmin && o.invoice ? (
                    <form action={markInvoicePaid}>
                      <input type="hidden" name="invoiceNo" value={o.invoice.invoiceNo} />
                      <Button type="submit" size="sm">
                        Markera betald
                      </Button>
                    </form>
                  ) : (
                    <span className="text-[13px] text-[var(--av-text-muted)]">Väntar</span>
                  )
                }
              />
            );
          })}
          </DashList>
        </section>
      )}
    </div>
  );
}
