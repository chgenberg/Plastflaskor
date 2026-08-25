import Link from "next/link";
import { getSessionUser } from "@/server/rbac";
import { listAllOrders } from "@/server/services/order.service";
import { markInvoicePaid } from "@/actions";
import { Button, EmptyState, KpiCard, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function FinancePage() {
  const user = await getSessionUser();
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
      <PageHeader title="Ekonomi" subtitle="Redo att fakturera, utfärdade och väntar betalning." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Redo att faktureras" value={ready.length} />
        <KpiCard label="Fakturerade" value={invoiced.length} />
        <KpiCard label="Fakturerade denna vecka" value={invoicedWeek.length} />
        <KpiCard label="Väntar betalning" value={waiting.length} />
      </div>
      {ready.length === 0 ? (
        <EmptyState title="Inget att fakturera" body="När en order är levererad eller redo för faktura syns den här." />
      ) : (
        <Panel padded={false} title="Redo att faktureras">
          <ul className="divide-y divide-black/5">
            {ready.map((o) => {
              const value = o.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
              return (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-mono">{o.orderNo}</p>
                    <p>{o.reseller.company.name}</p>
                    <p className="text-[#6b7280]">
                      {o.items[0]?.qty} × {o.items[0]?.variant.product.name} · {value.toLocaleString("sv-SE")} kr
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/operations/ordrar/${o.orderNo}`} className="text-[#6b7280]">
                      Granska
                    </Link>
                    <Link href={`/operations/ekonomi/${o.orderNo}/fakturera`} className="font-medium text-[#3B5BAA]">
                      Slutför & fakturera
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
      {waiting.length === 0 ? null : (
        <Panel padded={false} title="Väntar betalning">
          <ul className="divide-y divide-black/5">
            {waiting.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-mono">{o.invoice?.invoiceNo}</p>
                  <p>{o.reseller.company.name}</p>
                  <p className="text-[#6b7280]">{o.orderNo}</p>
                </div>
                {isAdmin && o.invoice ? (
                  <form action={markInvoicePaid}>
                    <input type="hidden" name="invoiceNo" value={o.invoice.invoiceNo} />
                    <Button type="submit" variant="secondary">
                      Markera betald
                    </Button>
                  </form>
                ) : (
                  <span className="text-[#6b7280]">Väntar</span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
