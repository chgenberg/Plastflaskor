import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { EmptyState, PageHeader } from "@/ui/shell/primitives";
import { BUYER_STATUS, RESELLER_STATUS, eventLabel } from "@/domain/enums";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { BuyerOrderCard } from "@/ui/order/BuyerOrderCard";

export default async function PartnerOrders({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; product?: string; from?: string; to?: string; status?: string; delivered?: string; artwork?: string }>;
}) {
  const { q, product, from, to, status, delivered, artwork } = await searchParams;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.resellerId ? await listOrdersForReseller(user.resellerId) : [];
  const products = [...new Set(orders.map((o) => o.items[0]?.variant.product.name).filter(Boolean))] as string[];
  const statuses = [...new Set(orders.map((o) => o.currentStatus))];
  const filtered = orders.filter((o) => {
    const hay = `${o.orderNo} ${o.customer.name} ${o.items[0]?.variant.product.name}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (product && o.items[0]?.variant.product.name !== product) return false;
    if (status && o.currentStatus !== status) return false;
    if (delivered === "1" && !["DELIVERED", "INVOICED", "PAID"].includes(o.currentStatus)) return false;
    if (artwork === "1" && !o.items.some((i) => i.designId) && o.designs.length === 0) return false;
    if (from && o.createdAt < new Date(from)) return false;
    if (to && o.createdAt > new Date(`${to}T23:59:59`)) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Ordrar" subtitle="Filtrera på produkt, datum, status, leverans och artwork." />
      <form className="grid gap-3 av-card p-5 sm:grid-cols-2 lg:grid-cols-3">
        <input name="q" defaultValue={q} placeholder="Sök kund, ordernummer" className="h-11 rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4 text-sm" />
        <select name="product" defaultValue={product ?? ""} className="h-11 rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4 text-sm">
          <option value="">Alla produkter</option>
          {products.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="h-11 rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4 text-sm">
          <option value="">Alla statusar</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {RESELLER_STATUS[s] ?? BUYER_STATUS[s] ?? eventLabel(s)}
            </option>
          ))}
        </select>
        <label className="text-sm text-[var(--av-text-muted)]">
          Från
          <input type="date" name="from" defaultValue={from} className="mt-1 h-11 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4 text-sm text-[var(--av-text)]" />
        </label>
        <label className="text-sm text-[var(--av-text-muted)]">
          Till
          <input type="date" name="to" defaultValue={to} className="mt-1 h-11 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4 text-sm text-[var(--av-text)]" />
        </label>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="delivered" value="1" defaultChecked={delivered === "1"} />
            Levererade
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="artwork" value="1" defaultChecked={artwork === "1"} />
            Har tryckfil
          </label>
          <button type="submit" className="h-11 rounded-full bg-[var(--av-accent)] px-5 text-sm font-semibold text-white">
            Filtrera
          </button>
        </div>
      </form>
      {!user.resellerId ? (
        <EmptyState title="Ingen återförsäljare kopplad" body="Orderhistorik visas bara för ett ÅF-konto." />
      ) : filtered.length === 0 ? (
        <EmptyState title="Inga ordrar" body={q || product || status ? "Inget matchade filtret." : "När du lägger en order syns den här."} />
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const item = o.items[0];
            const spec = specFromOrderItem({
              visualSpecJson: o.visualSpecJson,
              item,
              imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
            });
            const delivery = o.aquaApprovedDelivery
              ? `Leverans ${o.aquaApprovedDelivery}`
              : o.preliminaryDate
                ? `Preliminärt ${o.preliminaryDate}`
                : o.requestedDate
                  ? `Önskad ${o.requestedDate}`
                  : null;
            return (
              <BuyerOrderCard
                key={o.id}
                href={`/partner/ordrar/${o.orderNo}`}
                orderNo={o.orderNo}
                spec={spec}
                status={o.currentStatus}
                statusLabel={RESELLER_STATUS[o.currentStatus] ?? BUYER_STATUS[o.currentStatus] ?? eventLabel(o.currentStatus)}
                delivery={delivery}
                customer={o.customer.name}
                actionHref={o.lockedAt ? `/partner/ordrar/${o.orderNo}/repeat` : null}
                actionLabel={o.lockedAt ? "Beställ igen" : null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
