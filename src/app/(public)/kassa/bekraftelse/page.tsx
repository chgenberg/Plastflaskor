import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, homeForRole } from "@/server/rbac";
import { assertBuyerCanAccess, getOrderByNo } from "@/server/services/order.service";
import { BUYER_STATUS } from "@/domain/enums";
import { canSeePrices } from "@/domain/policies/priceVisibility";
import { PublicPage } from "@/ui/public/PageIntro";
import { LinkButton } from "@/ui/shell/primitives";

export default async function CheckoutThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNo } = await searchParams;
  if (!orderNo) redirect("/konto/ordrar");
  const next = `/kassa/bekraftelse?order=${encodeURIComponent(orderNo)}`;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (user.role !== "CUSTOMER") redirect(homeForRole(user.role));
  const order = await getOrderByNo(orderNo);
  if (!order) redirect("/konto/ordrar");
  assertBuyerCanAccess(order, user);

  const item = order.items[0];
  const showPrice = canSeePrices(user.role);
  const line = item ? Math.round(item.unitPriceExVat * item.qty * 100) / 100 : null;

  return (
    <PublicPage narrow>
      <p className="av-label">Order mottagen</p>
      <h1 className="av-serif mt-2 text-3xl tracking-[-0.02em]">{order.orderNo}</h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--av-text-secondary)]">
        Agenten har meddelat Aqua. Slutlig orderbekräftelse med korrektur kommer inom 24 timmar.
      </p>
      <dl className="av-card mt-8 space-y-3 p-7 text-sm">
        <div>
          <dt className="av-label">Status</dt>
          <dd className="mt-1 font-medium">{BUYER_STATUS[order.currentStatus] ?? order.currentStatus}</dd>
        </div>
        {item ? (
          <div>
            <dt className="av-label">Produkt</dt>
            <dd className="mt-1 font-medium">
              {item.variant.product.name} · {item.qty.toLocaleString("sv-SE")} st
            </dd>
          </div>
        ) : null}
        {showPrice && item && line != null ? (
          <div>
            <dt className="av-label">Belopp exkl. moms</dt>
            <dd className="mt-1 font-medium">
              {line.toLocaleString("sv-SE")} ({item.unitPriceExVat.toLocaleString("sv-SE")} / st)
            </dd>
          </div>
        ) : null}
        {order.preliminaryDate ? (
          <div>
            <dt className="av-label">Preliminärt leveransdatum</dt>
            <dd className="mt-1 font-medium">{order.preliminaryDate}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href={`/konto/ordrar?order=${order.orderNo}`}>Öppna ordern</LinkButton>
        <Link href="/konto" className="text-sm font-medium text-[var(--av-accent)]">
          Till kundportalen
        </Link>
      </div>
    </PublicPage>
  );
}
