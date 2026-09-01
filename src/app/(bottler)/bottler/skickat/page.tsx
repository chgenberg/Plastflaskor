import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { listJobsForFactory } from "@/server/services/production.service";
import { bottlerDeskStatus } from "@/domain/bottlerDesk";
import { planFromItem } from "@/domain/bottlerPlan";
import { BottlerJobsTable } from "@/ui/supplier/BottlerJobsTable";
import { DashPage, EmptyState, PageHeader } from "@/ui/shell/primitives";

export default async function BottlerShippedPage() {
  const user = await requireSupplier("bottler");
  const factoryId = scopedFactoryId(user);
  if ((user.role === "BOTTLER" || user.role === "FACTORY") && !user.factoryId) {
    return (
      <DashPage>
        <PageHeader title="Skickat" />
        <EmptyState title="Ingen bottler kopplad" body="Logga in som bottler för att se skickade ordrar." />
      </DashPage>
    );
  }
  const jobs = (await listJobsForFactory(factoryId, "bottler")).filter((j) => j.order.currentStatus === "SHIPPED");
  return (
    <DashPage>
      <PageHeader title="Skickat" subtitle="Bottler — ordrar ni har markerat som skickade. Ingen pris- eller fakturainformation." />
      {jobs.length === 0 ? (
        <EmptyState title="Inga skickade ordrar" body="När ni markerar en order som skickad flyttas den hit." />
      ) : (
        <BottlerJobsTable
          rows={jobs.map((j) => {
            const item = j.order.items[0];
            const plan = planFromItem({
              volumeMl: item?.variant.volumeMl,
              visualSpecJson: j.order.visualSpecJson ?? item?.visualSpecJson,
              optionsJson: item?.variant.optionsJson,
              productName: item?.variant.product.name,
            });
            return {
              id: j.id,
              href: `/bottler/jobb/${j.id}`,
              orderNo: j.order.orderNo,
              customer: j.order.customer.name,
              product: item?.variant.product.name ?? "–",
              qty: item?.qty ?? 0,
              deadline: j.order.factoryDeadline,
              deadlineAccepted: j.order.factoryDeadlineAccepted,
              ...bottlerDeskStatus({ jobStatus: j.status, orderStatus: j.order.currentStatus }),
              ...plan,
            };
          })}
        />
      )}
    </DashPage>
  );
}
