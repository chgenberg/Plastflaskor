import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { isOverdue } from "@/domain/orderBrief";
import { DashList, DashRow, LinkButton, StatusChip } from "@/ui/shell/primitives";

type ResultOrder = {
  id: string;
  orderNo: string;
  currentStatus: string;
  requestedDate: string | null;
  factoryIssueNote: string | null;
  factoryDeadlineAccepted: boolean;
  deliveryRequirement?: string | null;
  visualSpecJson?: string | null;
  customer: { name: string };
  items: {
    qty: number;
    visualSpecJson?: string | null;
    variant: { volumeMl: number | null; optionsJson: string; product: { name: string; slug: string } };
  }[];
};

export function OrderResultsTable({ orders, hrefBase = "/operations/ordrar" }: { orders: ResultOrder[]; hrefBase?: string }) {
  return (
    <DashList>
      {orders.map((o) => {
        const href = `${hrefBase}/${o.orderNo}`;
        const item = o.items[0];
        const late = isOverdue(o.currentStatus, o.requestedDate);
        const flagged = Boolean(o.factoryIssueNote) && !o.factoryDeadlineAccepted;
        const product = item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–";
        const delivery = o.requestedDate ? `Leverans ${o.requestedDate}` : "Inget leveransdatum";
        return (
          <DashRow
            key={o.id}
            primary={o.orderNo}
            primaryHref={href}
            columns={[
              o.customer.name,
              product,
              <span key="d" className={late ? "font-medium text-[var(--av-status-blocked-fg)]" : undefined}>
                {delivery}
                {o.deliveryRequirement ? " · Leveranskrav" : ""}
                {flagged ? " · Flagga" : ""}
              </span>,
            ]}
            status={<StatusChip status={o.currentStatus} label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]} requestedDate={o.requestedDate} />}
            actions={
              <LinkButton href={href} variant="secondary" size="sm">
                Öppna
              </LinkButton>
            }
          />
        );
      })}
    </DashList>
  );
}
