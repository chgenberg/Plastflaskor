import Link from "next/link";
import { InvoiceStatus, OrderStatus } from "@prisma/client";
import { listActiveFactories, listAllOrders } from "@/server/services/order.service";
import { PIPELINE_PHASES } from "@/domain/enums";
import { isExceptionKind, ordersWithAlert } from "@/domain/exceptions";
import { OrderFilterForm } from "@/ui/ops/OrderFilterForm";
import { OrderResultsTable } from "@/ui/ops/OrderResultsTable";
import { EmptyState, PageHeader } from "@/ui/shell/primitives";

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
  }>;
}) {
  const params = await searchParams;
  const { phase, q, late, status, from, to, size, waterType, factory, invoice, alert } = params;
  const phaseDef = PIPELINE_PHASES.find((p) => p.id === phase);
  const statusCode = asEnum(status, Object.values(OrderStatus));
  const invoiceStatus = asEnum(invoice, Object.values(InvoiceStatus));
  const sizeCode = asEnum(size, SIZES);
  const waterCode = asEnum(waterType, WATER_TYPES);
  const lateCode = late === "1" || late === "0" ? late : undefined;

  const all = await listAllOrders({
    q,
    status: statusCode,
    phaseStatuses: !statusCode && phaseDef ? [...phaseDef.statuses] : undefined,
    factoryId: factory,
    invoiceStatus,
    dateFrom: from,
    dateTo: to,
    size: sizeCode,
    waterType: waterCode,
    late: lateCode,
  });
  const orders = isExceptionKind(alert) ? ordersWithAlert(all, alert) : all;
  const factories = await listActiveFactories();
  const title = alert
    ? "Behöver åtgärd"
    : late === "1"
      ? "Försenade"
      : (phaseDef?.label ?? "Alla ordrar");

  return (
    <div className="space-y-8">
      <PageHeader title={title} subtitle="Sök på order, kund, produkt, org.nr, kontakt, tracking eller faktura." />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/operations/ordrar" className={!late && !phase && !alert ? "font-medium text-[var(--av-accent)]" : "text-[var(--av-text-muted)]"}>
          Alla
        </Link>
        <Link href="/operations/pipeline" className="text-[var(--av-text-muted)]">
          Pipeline
        </Link>
      </div>
      <OrderFilterForm
        values={{ q, phase, status, from, to, size, waterType, factory, invoice, late }}
        factories={factories}
      />
      {orders.length === 0 ? (
        <EmptyState title="Inga ordrar" body={q || phase || status || alert ? "Inget matchade filtret." : "När ordrar kommer in syns de här."} />
      ) : (
        <OrderResultsTable orders={orders} />
      )}
    </div>
  );
}
