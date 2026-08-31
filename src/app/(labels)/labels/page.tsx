import { listJobsForFactory } from "@/server/services/production.service";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { SupplierDesk } from "@/ui/supplier/SupplierDesk";

export default async function LabelsHome() {
  const user = await requireSupplier("label");
  const factoryId = scopedFactoryId(user);
  const missing = user.role === "LABEL" && !user.factoryId;
  const jobs = missing ? [] : await listJobsForFactory(factoryId);
  return <SupplierDesk jobs={jobs} kind="label" basePath="/labels" missingFactory={missing} />;
}
