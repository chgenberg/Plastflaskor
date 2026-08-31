import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { InvoiceTable } from "@/ui/order/InvoiceTable";
import { EmptyState, PageHeader } from "@/ui/shell/primitives";

export default async function PartnerInvoices() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.resellerId ? await listOrdersForReseller(user.resellerId) : [];
  const rows = orders
    .filter((o) => o.invoice)
    .map((o) => ({
      id: o.id,
      invoiceNo: o.invoice!.invoiceNo,
      orderNo: o.orderNo,
      customer: o.customer.name,
      amountIncVat: o.invoice!.amountIncVat,
      status: o.invoice!.status,
      dueAt: o.invoice!.dueAt,
      issuedAt: o.invoice!.issuedAt,
      pdfId: o.documents.find((d) => d.kind === "FINANCE")?.id ?? null,
    }));
  return (
    <div className="space-y-8">
      <PageHeader title="Fakturor" subtitle="Betald, obetald och förfallen — samma vy som kundportalen." />
      {rows.length === 0 ? (
        <EmptyState title="Inga fakturor" body="När Aqua fakturerar en order syns den här." />
      ) : (
        <InvoiceTable rows={rows} showCustomer />
      )}
    </div>
  );
}
