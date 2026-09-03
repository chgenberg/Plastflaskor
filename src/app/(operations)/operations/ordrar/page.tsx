import { InvoiceStatus, OrderStatus } from "@prisma/client";
import { listActiveFactories, listAllOrders } from "@/server/services/order.service";
import { ORDER_LIST_LANES, PIPELINE_PHASES } from "@/domain/enums";
import { isExceptionKind, ordersWithAlert } from "@/domain/exceptions";
import { OrderFilterForm } from "@/ui/ops/OrderFilterForm";
import { OrderResultsTable } from "@/ui/ops/OrderResultsTable";
import { DashPage, EmptyState, LinkButton, PageHeader } from "@/ui/shell/primitives";

const SIZES = ["33", "50"] as const;
const WATER_TYPES = ["stilla", "kolsyrat"] as const;

function asEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export default async function OpsOrders({
  searchParams,
}: {
  searchParams: Promise<{
    phase?: string;
    lane?: string;
    q?: string;
    late?: string;
    status?: string;
    from?: string;
    to?: string;
    size?: string;
    waterType?: string;
    factory?: string;
    invoice?: string;
    alert?: string;
    kund?: string;
  }>;
}) {
  const params = await searchParams;
  const { phase, lane, q, late, status, from, to, size, waterType, factory, invoice, alert, kund } = params;
  const laneDef = ORDER_LIST_LANES.find((item) => item.id === lane);
  const phaseDef = PIPELINE_PHASES.find((p) => p.id === phase);
  const statusCode = asEnum(status, Object.values(OrderStatus));
  const invoiceStatus = asEnum(invoice, Object.values(InvoiceStatus));
  const sizeCode = asEnum(size, SIZES);
  const waterCode = asEnum(waterType, WATER_TYPES);
  const lateCode = late === "1" || late === "0" ? late : undefined;
  const phaseStatuses = !statusCode
    ? laneDef
      ? [...laneDef.statuses]
      : phaseDef
        ? [...phaseDef.statuses]
        : undefined
    : undefined;

  const all = await listAllOrders({
    q,
    status: statusCode,
    phaseStatuses,
    factoryId: factory,
    invoiceStatus,
    dateFrom: from,
    dateTo: to,
    size: sizeCode,
    waterType: waterCode,
    late: lateCode,
  });
  const flagged = isExceptionKind(alert) ? ordersWithAlert(all, alert) : all;
  const orders = kund === "ny" ? flagged.filter((o) => !o.customer.verifiedAt) : flagged;
  const factories = await listActiveFactories();
  const title = alert
    ? "Behöver åtgärd"
    : late === "1"
      ? "Försenade"
      : (laneDef?.label ?? phaseDef?.label ?? "Ordermottagning");

  return (
    <DashPage>
      <PageHeader
        title={title}
        subtitle="Filtrera på fas eller sök order, kund, produkt, org.nr eller tracking."
        action={
          <LinkButton href="/operations/ordrar/ny" size="sm">
            Ny order
          </LinkButton>
        }
      />
      <OrderFilterForm
        values={{ q, lane, phase, from, to, size, waterType, factory, late }}
        factories={factories}
      />
      {orders.length === 0 ? (
        <EmptyState
          title="Inga ordrar"
          body={
            q || lane || phase || status || alert
              ? "Inget matchade filtret."
              : "Registrera en inköpsorder från mejl med Ny order, eller vänta på att en kund skickar själv."
          }
        />
      ) : (
        <OrderResultsTable orders={orders} />
      )}
    </DashPage>
  );
}
