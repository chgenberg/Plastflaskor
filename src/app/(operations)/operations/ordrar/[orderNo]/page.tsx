import { notFound } from "next/navigation";
import { getOrderByNo, eventsFor } from "@/server/services/order.service";
import { ORDER_STEPS, ORDER_STEP_LABELS } from "@/domain/enums";
import { Button, FileLink, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";
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
    <div className="space-y-8">
      <PageHeader title={order.customer.name} subtitle={`${order.orderNo} · ÅF: ${order.reseller.company.name}`} />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Panel title="Produktionsstatus">
          <ol className="space-y-2 text-sm">
            {ORDER_STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${i < idx ? "bg-[#16a34a]" : i === idx ? "bg-[#d97706]" : "bg-[#d4d4d8]"}`} />
                <span className={i === idx ? "font-medium" : "text-[#6b7280]"}>{ORDER_STEP_LABELS[s]}</span>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-5">
          <Panel>
            <StatusChip status={order.currentStatus} label={ORDER_STEP_LABELS[order.currentStatus]} />
            <p className="mt-4 text-[15px]">
              {order.items[0]?.qty} × {order.items[0]?.variant.product.name}
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums">{value.toLocaleString("sv-SE")} kr</p>
            <p className="mt-4 text-sm text-[#6b7280]">
              Vad händer nu? {ORDER_STEP_LABELS[order.currentStatus]}. Nästa steg: {next ? ORDER_STEP_LABELS[next] : "Klar"}.
            </p>
            {next ? (
              <form action={opsAdvanceAction} className="mt-5">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <input type="hidden" name="toStatus" value={next} />
                <Button type="submit">Markera: {ORDER_STEP_LABELS[next]}</Button>
              </form>
            ) : null}
            {order.currentStatus === "READY_TO_INVOICE" || order.currentStatus === "DELIVERED" ? (
              <div className="mt-4">
                <LinkButton href={`/operations/ekonomi/${order.orderNo}/fakturera`}>Slutför order & fakturera</LinkButton>
              </div>
            ) : null}
          </Panel>
          <Panel title="Dokument">
            {order.documents.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Inga dokument ännu.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {order.documents.map((d) => (
                  <li key={d.id}>
                    <FileLink href={`/api/documents/${d.id}`}>
                      {d.kind}: {d.title} (v{d.version})
                    </FileLink>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Eventlogg">
            <ol className="space-y-2 text-sm text-[#6b7280]">
              {events.map((e) => (
                <li key={e.id}>
                  {e.occurredAt.toLocaleString("sv-SE")} – {ORDER_STEP_LABELS[e.toStatus as keyof typeof ORDER_STEP_LABELS] ?? e.toStatus}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
