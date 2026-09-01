import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { listAllOrders } from "@/server/services/order.service";
import Link from "next/link";
import { DashTable, EmptyState, LinkButton, PageHeader, StatusChip, TableActions } from "@/ui/shell/primitives";

export default async function ShippingPage() {
  const orders = await listAllOrders({ phaseStatuses: ["READY_TO_SHIP", "SHIPPED"] });
  return (
    <div className="space-y-4">
      <PageHeader title="Frakt" subtitle="Fraktsedel, spårning och leverans." />
      {orders.length === 0 ? (
        <EmptyState title="Inget att skicka" body="När produktion är klar syns ordrarna här." />
      ) : (
        <DashTable
          count={`${orders.length} order${orders.length === 1 ? "" : "ar"}`}
          columns={[
            { label: "Order" },
            { label: "Kund" },
            { label: "Innehåll" },
            { label: "Spårning" },
            { label: "Status" },
            { label: "Åtgärd", sr: true },
          ]}
        >
          {orders.map((o) => {
            const item = o.items[0];
            const goods = o.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER");
            const cta =
              o.currentStatus === "READY_TO_SHIP" && !goods
                ? { href: `/operations/ordrar/${o.orderNo}`, label: "Skapa fraktsedel" }
                : o.currentStatus === "SHIPPED"
                  ? { href: `/operations/ordrar/${o.orderNo}`, label: "Markera levererad" }
                  : { href: `/operations/ordrar/${o.orderNo}`, label: "Öppna" };
            return (
              <tr key={o.id}>
                <td>
                  <Link href={`/operations/ordrar/${o.orderNo}`} className="font-semibold text-[var(--av-text)] hover:text-[var(--av-accent)]">
                    {o.orderNo}
                  </Link>
                </td>
                <td>{o.customer.name}</td>
                <td>{item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–"}</td>
                <td className="text-[var(--av-text-secondary)]">{goods?.trackingNo ? goods.trackingNo : "Saknas"}</td>
                <td>
                  <StatusChip
                    status={o.currentStatus}
                    label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                    requestedDate={o.requestedDate}
                  />
                </td>
                <td className="av-actions">
                  <TableActions>
                    <LinkButton href={cta.href} variant={cta.label === "Öppna" ? "secondary" : "primary"} size="sm">
                      {cta.label}
                    </LinkButton>
                  </TableActions>
                </td>
              </tr>
            );
          })}
        </DashTable>
      )}
    </div>
  );
}
