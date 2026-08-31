import Link from "next/link";
import { BuyerType, InvoiceStatus, OrderStatus } from "@prisma/client";
import { listActiveFactories, listAllOrders } from "@/server/services/order.service";
import { PIPELINE_PHASES } from "@/domain/enums";
import { isExceptionKind, ordersWithAlert } from "@/domain/exceptions";
import { OrderFilterForm } from "@/ui/ops/OrderFilterForm";
import { OrderResultsTable } from "@/ui/ops/OrderResultsTable";
import { EmptyState, PageHeader } from "@/ui/shell/primitives";

const SIZES = ["12", "23", "35"] as const;
const WALLS = ["enkel", "dubbel"] as const;
const ECOS = ["ja", "nej"] as const;

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
    source?: string;
    status?: string;
    from?: string;
    to?: string;
    buyer?: string;
    size?: string;
    wall?: string;
    eco?: string;
    factory?: string;
    invoice?: string;
    alert?: string;
  }>;
}) {
  const params = await searchParams;
  const { phase, q, late, source, status, from, to, buyer, size, wall, eco, factory, invoice, alert } = params;
  const phaseDef = PIPELINE_PHASES.find((p) => p.id === phase);
  const statusCode = asEnum(status, Object.values(OrderStatus));
  const buyerType = asEnum(buyer, Object.values(BuyerType));
  const invoiceStatus = asEnum(invoice, Object.values(InvoiceStatus));
  const sizeCode = asEnum(size, SIZES);
  const wallCode = asEnum(wall, WALLS);
  const ecoCode = asEnum(eco, ECOS);
  const lateCode = late === "1" || late === "0" ? late : undefined;

  const all = await listAllOrders({
    q,
    status: statusCode,
    phaseStatuses: !statusCode && phaseDef ? [...phaseDef.statuses] : undefined,
    source: source === "quote" ? "public_quote" : undefined,
    buyerType,
    factoryId: factory,
    invoiceStatus,
    dateFrom: from,
    dateTo: to,
    size: sizeCode,
    wall: wallCode,
    eco: ecoCode,
    late: lateCode,
  });
  const orders = isExceptionKind(alert) ? ordersWithAlert(all, alert) : all;
  const factories = await listActiveFactories();
  const title = alert
    ? "Behöver åtgärd"
    : late === "1"
      ? "Försenade"
      : source === "quote"
        ? "Offerter"
        : (phaseDef?.label ?? "Alla ordrar");

  return (
    <div className="space-y-8">
      <PageHeader title={title} subtitle="Sök på order, kund, ÅF, produkt, org.nr, kontakt, tracking eller faktura." />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/operations/ordrar" className={!source && !late && !phase && !alert ? "font-medium text-[var(--av-accent)]" : "text-[var(--av-text-muted)]"}>
          Alla
        </Link>
        <Link href="/operations/ordrar?source=quote" className={source === "quote" ? "font-medium text-[var(--av-accent)]" : "text-[var(--av-text-muted)]"}>
          Offerter
        </Link>
        <Link href="/operations/pipeline" className="text-[var(--av-text-muted)]">
          Tavla
        </Link>
      </div>
      <OrderFilterForm
        values={{ q, phase, status, from, to, buyer, size, wall, eco, factory, invoice, late }}
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
