import { notFound } from "next/navigation";
import { getOrderByNo, eventsFor } from "@/server/services/order.service";
import { ORDER_STEPS, ORDER_STEP_LABELS } from "@/domain/enums";
import { StatusChip } from "@/ui/shell/primitives";
import { opsAdvanceAction } from "@/actions";

export default async function OpsOrderDetail({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const order = await getOrderByNo(orderNo);
  if (!order) notFound();
  const events = await eventsFor(order.id);
  const idx = ORDER_STEPS.indexOf(order.currentStatus);
  const next = ORDER_STEPS[idx + 1];
  const value = order.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl bg-white p-5">
        <h2 className="font-semibold">Produktionsstatus</h2>
        <ol className="mt-4 space-y-2 text-sm">
          {ORDER_STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${i < idx ? "bg-[var(--av-green-500)]" : i === idx ? "bg-[var(--av-yellow-500)]" : "bg-[var(--av-slate-500)]"}`} />
              {ORDER_STEP_LABELS[s]}
            </li>
          ))}
        </ol>
      </aside>
      <section className="rounded-2xl bg-white p-6">
        <p className="font-mono text-sm">{order.orderNo}</p>
        <h1 className="text-3xl font-semibold">{order.customer.name}</h1>
        <p className="text-sm text-[var(--av-text-secondary)]">ÅF: {order.reseller.company.name}</p>
        <p className="mt-3">
          {order.items[0]?.qty} × {order.items[0]?.variant.product.name}
        </p>
        <StatusChip status={order.currentStatus} label={ORDER_STEP_LABELS[order.currentStatus]} />
        <p className="mt-4 text-lg font-semibold">{value.toLocaleString("sv-SE")} kr</p>
        <p className="mt-4 text-sm">
          Vad händer nu? {ORDER_STEP_LABELS[order.currentStatus]}. Nästa steg: {next ? ORDER_STEP_LABELS[next] : "Klar"}.
        </p>
        {next ? (
          <form action={opsAdvanceAction} className="mt-4">
            <input type="hidden" name="orderNo" value={order.orderNo} />
            <input type="hidden" name="toStatus" value={next} />
            <button className="rounded-xl bg-[var(--av-accent)] px-4 py-2 text-sm text-white">Markera: {ORDER_STEP_LABELS[next]}</button>
          </form>
        ) : null}
        {order.currentStatus === "READY_TO_INVOICE" || order.currentStatus === "DELIVERED" ? (
          <a href={`/operations/ekonomi/${order.orderNo}/fakturera`} className="mt-3 inline-block text-sm text-[var(--av-accent)]">
            Slutför order & fakturera
          </a>
        ) : null}
        <h2 className="mt-8 font-semibold">Dokument</h2>
        <ul className="mt-2 text-sm">
          {order.documents.map((d) => (
            <li key={d.id}>
              {d.kind}: {d.title} (v{d.version})
            </li>
          ))}
        </ul>
        <h2 className="mt-8 font-semibold">Eventlogg</h2>
        <ol className="mt-2 space-y-1 text-sm text-[var(--av-text-secondary)]">
          {events.map((e) => (
            <li key={e.id}>
              {e.occurredAt.toLocaleString("sv-SE")} – {ORDER_STEP_LABELS[e.toStatus as keyof typeof ORDER_STEP_LABELS] ?? e.toStatus}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
