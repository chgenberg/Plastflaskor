import { requireRole } from "@/server/rbac";
import { listOrdersForCustomer } from "@/server/services/order.service";
import { findKontoOrder, KontoOrderPeek } from "@/ui/order/KontoOrderPeek";
import { InvoiceTable } from "@/ui/order/InvoiceTable";
import { DashPage, EmptyState, PageHeader } from "@/ui/shell/primitives";

export default async function KontoInvoices({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: peekNo } = await searchParams;
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.customerId ? await listOrdersForCustomer(user.customerId) : [];
  const peek = findKontoOrder(orders, peekNo);
  const rows = orders
    .filter((o) => o.invoice)
    .map((o) => ({
      id: o.id,
      invoiceNo: o.invoice!.invoiceNo,
      orderNo: o.orderNo,
      amountIncVat: o.invoice!.amountIncVat,
      status: o.invoice!.status,
      dueAt: o.invoice!.dueAt,
      issuedAt: o.invoice!.issuedAt,
      pdfId: o.documents.find((d) => d.kind === "FINANCE")?.id ?? null,
    }));
  return (
    <DashPage>
      <PageHeader title="Fakturor" />
      {rows.length === 0 ? (
        <EmptyState title="Inga fakturor" body="När en order faktureras syns den här." />
      ) : (
        <InvoiceTable rows={rows} />
      )}
      {peek ? <KontoOrderPeek order={peek} role={user.role} closeHref="/konto/fakturor" /> : null}
    </DashPage>
  );
}
