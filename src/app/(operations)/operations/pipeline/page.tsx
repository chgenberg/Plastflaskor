import { listAllOrders } from "@/server/services/order.service";
import { KanbanBoard } from "@/ui/ops/KanbanBoard";
import { DashPage, PageHeader } from "@/ui/shell/primitives";

export default async function PipelinePage() {
  const orders = await listAllOrders();
  return (
    <DashPage>
      <PageHeader title="Pipeline" subtitle="Klicka på ett kort för att öppna ordern." />
      <KanbanBoard orders={orders} />
    </DashPage>
  );
}
