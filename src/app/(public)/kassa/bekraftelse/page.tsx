import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { assertCheckoutToken } from "@/server/services/checkout.service";
import { BUYER_STATUS } from "@/domain/enums";
import { PageIntro } from "@/ui/public/PageIntro";

export default async function CheckoutThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; t?: string }>;
}) {
  const { order: orderNo, t } = await searchParams;
  if (!orderNo || !t) notFound();
  try {
    assertCheckoutToken(orderNo, t);
  } catch {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      customer: true,
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!order) notFound();
  const item = order.items[0];
  const statusLabel = BUYER_STATUS[order.currentStatus] ?? order.currentStatus;

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-16">
      <PageIntro badge="Mottagen" title="Ordern är mottagen" />
      <p className="mt-4 text-[var(--av-text-secondary)]">
        Testdebitering validerad — order mottagen, orderbekräftelse med korrektur inom 24h.
      </p>
      <div className="av-card mt-8 p-7 text-sm">
        <p className="font-medium text-[var(--av-text)]">{item?.variant.product.name}</p>
        <p className="mt-1 text-[var(--av-text-muted)]">{item?.qty} st</p>
        <p className="mt-4 text-[var(--av-text)]">
          Status: {statusLabel} — väntar på Aqua
        </p>
        <p className="mt-4 text-[var(--av-text-muted)]">
          {order.customer.name}
          {order.customer.email ? ` · ${order.customer.email}` : ""}
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--av-text-muted)]">
          Referens {order.orderNo}. Ingen faktura har skapats. Aqua skickar orderbekräftelse med
          korrektur när ordern är granskad.
        </p>
      </div>
      <p className="mt-6 text-sm text-[var(--av-text-secondary)]">
        Vill du följa ordern i portalen nästa gång? Kryssa i kontorutan i kassan.{" "}
        <Link href="/login" className="font-medium text-[var(--av-accent)]">
          Logga in
        </Link>
      </p>
    </main>
  );
}
