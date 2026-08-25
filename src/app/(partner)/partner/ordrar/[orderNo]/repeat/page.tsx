import { notFound } from "next/navigation";
import { getOrderByNo } from "@/server/services/order.service";
import { requireRole } from "@/server/rbac";
import { repeatOrderAction } from "@/actions";
import { getPricesForReseller, resolveUnitPrice } from "@/server/services/catalog.service";
import { Button, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function RepeatPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const order = await getOrderByNo(orderNo);
  if (!order || (user.role === "RESELLER" && order.resellerId !== user.resellerId)) notFound();
  const item = order.items[0];
  const list = user.resellerId ? await getPricesForReseller(user.resellerId, item.variantId) : null;
  const preview = resolveUnitPrice(list?.items ?? [], item.variantId, item.qty);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader title="Beställ igen" subtitle={`${item.variant.product.name} · samma design, etikett och kund.`} />
      <Panel>
        <form action={repeatOrderAction} className="space-y-4">
          <input type="hidden" name="sourceOrderId" value={order.id} />
          <label className="block text-sm">
            Antal
            <select name="qty" defaultValue={item.qty} className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3">
              {[270, 540, 1080, 2500, 5000].map((n) => (
                <option key={n} value={n}>
                  {n} st
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Önskat leveransdatum
            <input required type="date" name="requestedDate" className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3" />
          </label>
          <label className="block text-sm">
            Samma artwork?
            <select name="sameArtwork" defaultValue="yes" className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3">
              <option value="yes">Ja</option>
              <option value="no">Nej, ny fil senare</option>
            </select>
          </label>
          <label className="block text-sm">
            Fakturareferens
            <input name="invoiceRef" defaultValue={order.invoiceRef ?? ""} className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3" />
          </label>
          {preview ? (
            <p className="text-sm text-[#6b7280]">
              Indikativt nettopris vid {item.qty} st: {preview.unitPriceExVat.toFixed(2)} kr/st
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Bekräfta repeat order
          </Button>
        </form>
      </Panel>
    </div>
  );
}
