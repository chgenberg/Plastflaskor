import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";

export default async function DocsPage() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.resellerId ? await listOrdersForReseller(user.resellerId) : [];
  const docs = orders.flatMap((o) => o.documents.map((d) => ({ ...d, orderNo: o.orderNo })));
  return (
    <div>
      <h1 className="text-3xl font-semibold">Dokument</h1>
      <ul className="mt-6 divide-y rounded-2xl bg-white">
        {docs.map((d) => (
          <li key={d.id} className="flex justify-between px-4 py-3 text-sm">
            <span>{d.title}</span>
            <span className="font-mono text-[var(--av-text-muted)]">{d.orderNo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
