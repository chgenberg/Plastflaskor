import { billedJobIds, listBottlerInvoices } from "@/server/services/bottlerInvoice.service";
import { listJobsForFactory } from "@/server/services/production.service";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { planFromItem } from "@/domain/bottlerPlan";
import { BottlerInvoiceForm } from "@/ui/supplier/BottlerInvoiceForm";
import { DashTable, EmptyState, LinkButton, PageHeader, TableActions } from "@/ui/shell/primitives";

export default async function BottlerDocs({
  searchParams,
}: {
  searchParams: Promise<{ underlag?: string }>;
}) {
  const user = await requireSupplier("bottler");
  const factoryId = scopedFactoryId(user);
  const { underlag } = await searchParams;
  if ((user.role === "BOTTLER" || user.role === "FACTORY") && !user.factoryId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dokument" />
        <EmptyState title="Ingen bottler kopplad" body="Fakturaunderlag visas här. Inga fakturor eller priser." />
      </div>
    );
  }
  const [reports, jobs, billed] = await Promise.all([
    listBottlerInvoices(factoryId, { chronological: true }),
    listJobsForFactory(factoryId, "bottler"),
    billedJobIds(factoryId),
  ]);
  const eligible = jobs.filter((j) => j.order.currentStatus === "SHIPPED" && !billed.has(j.id));
  const highlighted = underlag ? reports.find((r) => r.reportNo === underlag) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokument"
        subtitle="Fakturaunderlag för tappning. Ingen pris- eller fakturainformation."
      />
      {highlighted ? (
        <div className="av-card px-4 py-3 text-[13px]">
          <p className="font-semibold text-[var(--av-status-done-fg)]">{highlighted.reportNo} skapat</p>
          <p className="mt-1 tabular-nums text-[var(--av-text-secondary)]">
            {highlighted.orderCount} ordrar · {highlighted.qty.toLocaleString("sv-SE")} flaskor
          </p>
          {highlighted.documentId ? (
            <p className="mt-2">
              <LinkButton href={`/api/documents/${highlighted.documentId}`} variant="secondary" size="sm">
                Öppna underlag
              </LinkButton>
            </p>
          ) : null}
        </div>
      ) : null}
      {eligible.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-[13px] font-semibold tracking-tight">Skickade ordrar utan underlag</h2>
          <BottlerInvoiceForm
            rows={eligible.map((j) => {
              const item = j.order.items[0];
              const plan = planFromItem({
                volumeMl: item?.variant.volumeMl,
                visualSpecJson: j.order.visualSpecJson ?? item?.visualSpecJson,
                optionsJson: item?.variant.optionsJson,
                productName: item?.variant.product.name,
              });
              const ship = j.order.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER");
              return {
                id: j.id,
                orderNo: j.order.orderNo,
                customer: j.order.customer.name,
                product: item?.variant.product.name ?? "–",
                qty: item?.qty ?? 0,
                ...plan,
                trackingNo: ship?.trackingNo ?? "",
              };
            })}
          />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title="Inga underlag ännu"
          body="När ordrar är skickade kan ni samla dem här som fakturaunderlag mot Aqua."
        />
      ) : (
        <p className="text-[13px] text-[var(--av-text-muted)]">Alla skickade ordrar finns redan i ett underlag.</p>
      )}
      {reports.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-[13px] font-semibold tracking-tight">Skapade underlag</h2>
          <DashTable
            count={`${reports.length} underlag`}
            columns={[
              { label: "Datum" },
              { label: "Underlag" },
              { label: "Ordrar" },
              { label: "Antal" },
              { label: "Åtgärd", sr: true },
            ]}
          >
            {reports.map((r) => (
              <tr key={r.id} className={underlag === r.reportNo ? "av-row-shipped av-row-shipped-active" : undefined}>
                <td className="whitespace-nowrap tabular-nums text-[var(--av-text-secondary)]">
                  {new Date(r.createdAt).toLocaleString("sv-SE", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="font-semibold tabular-nums">{r.reportNo}</td>
                <td>{r.orderNos.join(", ") || `${r.orderCount} ordrar`}</td>
                <td className="tabular-nums">{r.qty.toLocaleString("sv-SE")} st</td>
                <td className="av-actions">
                  <TableActions>
                    {r.documentId ? (
                      <LinkButton href={`/api/documents/${r.documentId}`} variant="secondary" size="sm">
                        Öppna
                      </LinkButton>
                    ) : null}
                  </TableActions>
                </td>
              </tr>
            ))}
          </DashTable>
        </div>
      ) : null}
    </div>
  );
}
