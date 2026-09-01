import { listInboundLabelDispatches } from "@/server/services/labelDispatch.service";
import { listJobsForFactory } from "@/server/services/production.service";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { SupplierDesk } from "@/ui/supplier/SupplierDesk";

export default async function BottlerHome({
  searchParams,
}: {
  searchParams: Promise<{ inleverans?: string }>;
}) {
  const user = await requireSupplier("bottler");
  const factoryId = scopedFactoryId(user);
  const missing = (user.role === "BOTTLER" || user.role === "FACTORY") && !user.factoryId;
  const { inleverans } = await searchParams;
  const jobs = missing ? [] : await listJobsForFactory(factoryId, "bottler");
  const inboundReports = missing ? [] : await listInboundLabelDispatches(factoryId);
  return (
    <SupplierDesk
      jobs={jobs}
      kind="bottler"
      basePath="/bottler"
      missingFactory={missing}
      inboundReports={inboundReports}
      receivedReport={inleverans ?? null}
    />
  );
}
