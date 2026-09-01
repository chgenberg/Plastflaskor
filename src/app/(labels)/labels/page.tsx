import { listLabelDispatches } from "@/server/services/labelDispatch.service";
import { listJobsForFactory } from "@/server/services/production.service";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { SupplierDesk } from "@/ui/supplier/SupplierDesk";

export default async function LabelsHome({
  searchParams,
}: {
  searchParams: Promise<{ lage?: string; rapport?: string }>;
}) {
  const user = await requireSupplier("label");
  const factoryId = scopedFactoryId(user);
  const missing = user.role === "LABEL" && !user.factoryId;
  const { lage, rapport } = await searchParams;
  const jobs = missing ? [] : await listJobsForFactory(factoryId, "label");
  const reports = missing ? [] : await listLabelDispatches(factoryId);
  return (
    <SupplierDesk
      jobs={jobs}
      kind="label"
      basePath="/labels"
      missingFactory={missing}
      composeReport={lage === "rapport"}
      highlightReport={rapport ?? null}
      reports={reports}
    />
  );
}
