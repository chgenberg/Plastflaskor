import Link from "next/link";
import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { getSessionUser } from "@/server/rbac";
import { listAllOrders, orderValue } from "@/server/services/order.service";
import { getFortnoxConnection } from "@/server/integrations/status";
import { markInvoicePaid } from "@/actions";
import { Button, DashTable, EmptyState, KpiCard, LinkButton, PageHeader, SectionTitle, StatusChip, TableActions } from "@/ui/shell/primitives";
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
    <div className="space-y-4">
      <PageHeader
        title="Fakturering"
        subtitle="Redo att fakturera, utfärdade och väntar betalning."
        action={<FortnoxBadge label={fortnox.label} />}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard label="Redo att faktureras" value={ready.length} />
        <KpiCard label="Väntar betalning" value={waiting.length} />
      </div>
      {ready.length === 0 ? (
        <EmptyState title="Inget att fakturera" body="När en order är levererad eller redo för faktura syns den här." />
      ) : (
        <section className="space-y-2">
          <SectionTitle>Redo att faktureras</SectionTitle>
          <DashTable
            count={`${ready.length} order${ready.length === 1 ? "" : "ar"}`}
            columns={[
              { label: "Order" },
              { label: "Kund" },
              { label: "Innehåll" },
              { label: "Belopp", align: "right" },
              { label: "Status" },
              { label: "Åtgärd", sr: true },
            ]}
          >
            {ready.map((o) => {
              const value = orderValue(o);
              const item = o.items[0];
              return (
                <tr key={o.id}>
                  <td>
                    <Link href={`/operations/ordrar/${o.orderNo}`} className="font-semibold text-[var(--av-text)] hover:text-[var(--av-accent)]">
                      {o.orderNo}
                    </Link>
                  </td>
                  <td>{o.customer.name}</td>
                  <td>{item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–"}</td>
                  <td className="av-num font-semibold">{value.toLocaleString("sv-SE")} kr</td>
                  <td>
                    <StatusChip
                      status={o.currentStatus}
                      label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                      requestedDate={o.requestedDate}
                    />
                  </td>
                  <td className="av-actions">
                    <TableActions>
                      <LinkButton href={`/operations/ordrar/${o.orderNo}`} variant="secondary" size="sm">
                        Öppna
                      </LinkButton>
                      <LinkButton href={`/operations/ekonomi/${o.orderNo}/fakturera`} size="sm">
                        Fakturera
                      </LinkButton>
                    </TableActions>
                  </td>
                </tr>
              );
            })}
          </DashTable>
        </section>
      )}
      {waiting.length === 0 ? null : (
        <section className="space-y-2">
          <SectionTitle>Väntar betalning</SectionTitle>
          <DashTable
            count={`${waiting.length} faktura${waiting.length === 1 ? "" : "r"}`}
            columns={[
              { label: "Faktura" },
              { label: "Kund" },
              { label: "Order" },
              { label: "Innehåll" },
              { label: "Belopp", align: "right" },
              { label: "Status" },
              { label: "Åtgärd", sr: true },
            ]}
          >
            {waiting.map((o) => {
              const value = orderValue(o);
              const item = o.items[0];
              return (
                <tr key={o.id}>
                  <td className="font-semibold">{o.invoice?.invoiceNo ?? o.orderNo}</td>
                  <td>{o.customer.name}</td>
                  <td>{o.orderNo}</td>
                  <td>{item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–"}</td>
                  <td className="av-num font-semibold">{value.toLocaleString("sv-SE")} kr</td>
                  <td>
                    <StatusChip
                      status={o.currentStatus}
                      label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                      requestedDate={o.requestedDate}
                    />
                  </td>
                  <td className="av-actions">
                    {isAdmin && o.invoice ? (
                      <form action={markInvoicePaid}>
                        <input type="hidden" name="invoiceNo" value={o.invoice.invoiceNo} />
                        <Button type="submit" size="sm">
                          Markera betald
                        </Button>
                      </form>
                    ) : (
                      <span className="text-[13px] text-[var(--av-text-muted)]">Väntar</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </DashTable>
        </section>
      )}
    </div>
  );
}
