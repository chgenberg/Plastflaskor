import { notFound } from "next/navigation";
import { getOrderByNo } from "@/server/services/order.service";
import { requireRole } from "@/server/rbac";
import { repeatOrderAction } from "@/actions";
import { getPricesForReseller, resolveUnitPrice } from "@/server/services/catalog.service";
import { Button, PageHeader, Panel } from "@/ui/shell/primitives";
import { RepeatFields } from "@/ui/partner/RepeatFields";

const QTYS = [270, 540, 1080, 2500, 5000];

export default async function RepeatPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const order = await getOrderByNo(orderNo);
  if (!order || (user.role === "RESELLER" && order.resellerId !== user.resellerId)) notFound();
  const item = order.items[0];
  const list = await getPricesForReseller(user.resellerId ?? order.resellerId, item.variantId);
  const prices = Object.fromEntries(
    QTYS.map((n) => [n, resolveUnitPrice(list?.items ?? [], item.variantId, n)?.unitPriceExVat ?? null]),
  ) as Record<number, number | null>;
  const addresses = [
    order.shippingAddress,
    ...order.customer.addresses,
    ...order.reseller.company.addresses,
  ].filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i);
  const designName = order.designs[0]?.projectName ?? (item.designId ? "Samma artwork som förra ordern" : "Ingen design kopplad");
  const opt = JSON.parse(item.variant.optionsJson || "{}") as { waterType?: string; cap?: string; label?: string };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader title="Beställ igen" subtitle={`${item.variant.product.name} · samma design, etikett och kund.`} />
      <Panel title="Förifyllt från förra ordern">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-[#6b7280]">Produkt</dt>
            <dd className="font-medium">{item.variant.product.name}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Variant</dt>
            <dd>{item.variant.name}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Design / etikett</dt>
            <dd>
              {designName}
              {opt.label || opt.waterType || opt.cap
                ? ` · ${[opt.waterType, opt.cap, opt.label].filter(Boolean).join(" · ")}`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Kund</dt>
            <dd>{order.customer.name}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Senaste leveransadress</dt>
            <dd>
              {order.shippingAddress.line1}, {order.shippingAddress.postalCode} {order.shippingAddress.city}
            </dd>
          </div>
        </dl>
      </Panel>
      <Panel>
        <form action={repeatOrderAction} className="space-y-4">
          <input type="hidden" name="sourceOrderId" value={order.id} />
          <RepeatFields defaultQty={item.qty} prices={prices} />
          <label className="block text-sm">
            Leveransadress
            <select name="addressId" defaultValue={order.shippingAddressId} className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3">
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.line1}, {a.postalCode} {a.city}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Önskat leveransdatum
            <input required type="date" name="requestedDate" defaultValue={order.requestedDate ?? ""} className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3" />
          </label>
          <label className="block text-sm">
            Samma artwork?
            <select name="sameArtwork" defaultValue="yes" className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3">
              <option value="yes">Ja — {designName}</option>
              <option value="no">Nej, ny fil senare</option>
            </select>
          </label>
          <label className="block text-sm">
            Fakturareferens
            <input name="invoiceRef" defaultValue={order.invoiceRef ?? ""} className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3" />
          </label>
          <Button type="submit" className="w-full">
            Bekräfta repeat order
          </Button>
        </form>
      </Panel>
    </div>
  );
}
