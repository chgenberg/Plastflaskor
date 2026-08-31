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
    <main className="mx-auto max-w-xl px-4 pb-20 pt-36">
      <PageIntro badge="Mottagen" title="Ordern är mottagen" />
      <p className="mt-4 text-[var(--av-text-secondary)]">
        Testdebitering validerad — order mottagen, orderbekräftelse med korrektur inom 24h.
      </p>
      <div className="mt-8 rounded-[28px] bg-white p-7 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <p className="font-medium text-[#1d1d1f]">{item?.variant.product.name}</p>
        <p className="mt-1 text-[#6b7280]">{item?.qty} st</p>
        <p className="mt-4 text-[#1d1d1f]">
          Status: {statusLabel} — väntar på Aqua
        </p>
        <p className="mt-4 text-[#6b7280]">
          {order.customer.name}
          {order.customer.email ? ` · ${order.customer.email}` : ""}
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-[#6b7280]">
          Referens {order.orderNo}. Ingen faktura har skapats. Aqua skickar orderbekräftelse med
          korrektur när ordern är granskad.
        </p>
      </div>
      <p className="mt-6 text-sm text-[var(--av-text-secondary)]">
        Vill du följa ordern i portalen nästa gång? Kryssa i kontorutan i kassan.{" "}
        <Link href="/login" className="font-medium text-[#1d1d1f]">
          Logga in
        </Link>
      </p>
    </main>
  );
}
