import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByNo, eventsFor } from "@/server/services/order.service";
import { requireRole } from "@/server/rbac";
import { StatusChip } from "@/ui/shell/primitives";
import { ORDER_STEP_LABELS, RESELLER_STATUS } from "@/domain/enums";

export default async function PartnerOrderDetail({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const order = await getOrderByNo(orderNo);
  if (!order || (user.role === "RESELLER" && order.resellerId !== user.resellerId)) notFound();
  const events = await eventsFor(order.id);
  const value = order.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl bg-white p-6">
        <p className="font-mono text-sm text-[var(--av-text-muted)]">{order.orderNo}</p>
        <h1 className="mt-1 text-3xl font-semibold">{order.customer.name}</h1>
        <StatusChip status={order.currentStatus} label={RESELLER_STATUS[order.currentStatus]} />
        <p className="mt-4 text-sm">
          {order.items[0]?.qty} × {order.items[0]?.variant.product.name}
        </p>
        <p className="text-sm text-[var(--av-text-secondary)]">
          {order.shippingAddress.line1}, {order.shippingAddress.postalCode} {order.shippingAddress.city}
        </p>
        <p className="mt-2 text-lg font-semibold">{value.toLocaleString("sv-SE")} kr</p>
        <Link href={`/partner/ordrar/${order.orderNo}/repeat`} className="mt-6 inline-block rounded-xl bg-[var(--av-accent)] px-4 py-2 text-sm text-white">
          Beställ igen
        </Link>
        <h2 className="mt-8 font-semibold">Dokument</h2>
        <ul className="mt-2 text-sm">
          {order.documents.map((d) => (
            <li key={d.id}>{d.title}</li>
          ))}
        </ul>
      </div>
      <aside className="rounded-2xl bg-white p-6">
        <h2 className="font-semibold">Tidslinje</h2>
        <ol className="mt-4 space-y-3 text-sm">
          {events.map((e) => (
            <li key={e.id}>
              <p className="font-medium">{ORDER_STEP_LABELS[e.toStatus as keyof typeof ORDER_STEP_LABELS] ?? e.toStatus}</p>
              <p className="text-xs text-[var(--av-text-muted)]">{e.occurredAt.toLocaleString("sv-SE")}</p>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
