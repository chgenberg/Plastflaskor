import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { listAllOrders } from "@/server/services/order.service";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { DataRow, DataTable, EmptyState, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";

export default async function ShippingPage() {
  const orders = await listAllOrders({ phaseStatuses: ["READY_TO_SHIP", "SHIPPED"] });
  return (
    <div className="space-y-8">
      <PageHeader title="Frakt" subtitle="Fraktsedel, spårning och leverans." />
      {orders.length === 0 ? (
        <EmptyState title="Inget att skicka" body="När produktion är klar syns ordrarna här." />
      ) : (
        <Panel padded={false}>
          <DataTable headers={[{ label: "Order" }, { label: "Kund" }, { label: "Mugg" }, { label: "Status" }, { label: "Spårning" }, { label: "" }]}>
            {orders.map((o) => {
              const item = o.items[0];
              const spec = specFromOrderItem({
                visualSpecJson: o.visualSpecJson,
                item,
                imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
              });
              return (
                <DataRow key={o.id}>
                  <td className="px-5 py-3 font-mono">{o.orderNo}</td>
                  <td className="px-5 py-3">{o.customer.name}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium">
                      {spec?.productName ?? item?.variant.product.name ?? "–"}
                      {item ? ` · ${item.qty.toLocaleString("sv-SE")} st` : ""}
                    </p>
                    {spec ? <div className="mt-1"><VisualSpecCard spec={spec} dense /></div> : null}
                  </td>
                  <td className="px-5 py-3">
                    <StatusChip status={o.currentStatus} label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]} requestedDate={o.requestedDate} />
                  </td>
                  <td className="px-5 py-3 font-mono text-sm">{o.shipments[0]?.trackingNo ?? "–"}</td>
                  <td className="px-5 py-3">
                    {o.currentStatus === "READY_TO_SHIP" && !o.shipments[0] ? (
                      <LinkButton href={`/operations/ordrar/${o.orderNo}`}>Skapa fraktsedel</LinkButton>
                    ) : o.currentStatus === "READY_TO_SHIP" && o.shipments[0] ? (
                      <div className="space-y-2">
                        <p className="text-sm text-[#6b7280]">Fraktsedel klar · tryckeriet markerar skickad</p>
                        <LinkButton href={`/operations/ordrar/${o.orderNo}`} variant="secondary">Öppna</LinkButton>
                      </div>
                    ) : o.currentStatus === "SHIPPED" ? (
                      <LinkButton href={`/operations/ordrar/${o.orderNo}`}>Markera levererad</LinkButton>
                    ) : (
                      <LinkButton href={`/operations/ordrar/${o.orderNo}`}>Öppna</LinkButton>
                    )}
                  </td>
                </DataRow>
              );
            })}
          </DataTable>
        </Panel>
      )}
    </div>
  );
}
