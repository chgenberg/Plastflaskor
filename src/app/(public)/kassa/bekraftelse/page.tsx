import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { assertCheckoutToken } from "@/server/services/checkout.service";
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
      invoice: true,
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!order?.invoice) notFound();
  const item = order.items[0];

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-36">
      <PageIntro badge="Bekräftat" title="Tack för din testdebitering" />
      <p className="mt-4 text-[var(--av-text-secondary)]">
        Ingen affär har skett. Referens {order.orderNo}. Dummyfaktura {order.invoice.invoiceNo} är markerad som betald.
      </p>
      <div className="mt-8 rounded-[28px] bg-white p-7 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <p className="font-medium text-[#1d1d1f]">{item?.variant.product.name}</p>
        <p className="mt-1 text-[#6b7280]">
          {item?.qty} st · {order.invoice.amountIncVat.toFixed(2)} kr inkl. moms
        </p>
        <p className="mt-4 text-[#6b7280]">
          {order.customer.name}
          {order.customer.email ? ` · ${order.customer.email}` : ""}
        </p>
        <a
          href={`/api/checkout/invoice?order=${order.orderNo}&t=${t}`}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white"
        >
          Ladda ner dummyfaktura
        </a>
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
