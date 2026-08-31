import { listJobsForFactory } from "@/server/services/production.service";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { SupplierDesk } from "@/ui/supplier/SupplierDesk";

export default async function BottlerHome() {
  const user = await requireSupplier("bottler");
  const factoryId = scopedFactoryId(user);
  const missing = (user.role === "BOTTLER" || user.role === "FACTORY") && !user.factoryId;
  const jobs = missing ? [] : await listJobsForFactory(factoryId);
  return <SupplierDesk jobs={jobs} kind="bottler" basePath="/bottler" missingFactory={missing} />;
}
