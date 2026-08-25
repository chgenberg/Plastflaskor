import Link from "next/link";
import { listAllOrders } from "@/server/services/order.service";
import { KpiCard } from "@/ui/shell/primitives";

export default async function FinancePage() {
  const orders = await listAllOrders();
  const ready = orders.filter((o) => o.currentStatus === "READY_TO_INVOICE" || o.currentStatus === "DELIVERED");
  const invoiced = orders.filter((o) => o.invoice && o.invoice.status === "ISSUED");
  const waiting = invoiced.filter((o) => o.invoice?.status !== "PAID");
  return (
    <div>
      <h1 className="text-3xl font-semibold">Fakturering</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Redo att faktureras" value={ready.length} />
        <KpiCard label="Fakturerade" value={invoiced.length} />
        <KpiCard label="Väntar betalning" value={waiting.length} />
      </div>
      <ul className="mt-8 divide-y rounded-2xl bg-white">
        {ready.map((o) => {
          const value = o.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
          return (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-mono">{o.orderNo}</p>
                <p>{o.reseller.company.name}</p>
                <p className="text-[var(--av-text-muted)]">
                  {o.items[0]?.qty} × {o.items[0]?.variant.product.name} · {value.toLocaleString("sv-SE")} kr
                </p>
              </div>
              <div className="flex gap-3">
                <Link href={`/operations/ordrar/${o.orderNo}`}>Granska</Link>
                <Link href={`/operations/ekonomi/${o.orderNo}/fakturera`} className="text-[var(--av-accent)]">
                  Slutför & fakturera
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
