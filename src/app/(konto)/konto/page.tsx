import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { listOrdersForCustomer, orderValue } from "@/server/services/order.service";
import { customerActionFor } from "@/domain/orderBrief";
import { hintFactsFromOrder, statusHint } from "@/domain/statusHint";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { Reveal } from "@/ui/motion/Reveal";
import { BuyerOrderTable } from "@/ui/order/BuyerOrderCard";
import { findKontoOrder, kontoPeekHref, KontoOrderPeek } from "@/ui/order/KontoOrderPeek";
import {
  DashPage,
  EmptyState,
  KpiCard,
  KpiStrip,
  LinkButton,
  NeedsAttention,
  PageHeader,
  QuickLinks,
  StepIndicator,
} from "@/ui/shell/primitives";

const DONE = new Set(["PAID", "DELIVERED", "INVOICED"]);
const POST_STEPS = [
  { id: "ordered", label: "Beställd" },
  { id: "artwork", label: "Artwork" },
  { id: "proof", label: "Korr" },
  { id: "ob", label: "OB" },
];

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function KontoHome({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; steg?: string }>;
}) {
  const { order: peekNo, steg } = await searchParams;
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.customerId ? await listOrdersForCustomer(user.customerId) : [];
  const peek = findKontoOrder(orders, peekNo);
  const peekSteg = steg === "artwork" || steg === "korr" ? steg : undefined;
  const year = new Date().getFullYear();
  const today = todayYmd();
  const waiting = orders.filter((o) => customerActionFor(o) !== null);
  const firstOrder = orders.length === 1 && customerActionFor(orders[0]!) === "artwork";
  const empty = orders.length === 0;

  const attention = waiting
    .slice()
    .sort((a, b) => {
      const rank = { artwork: 0, proof: 1, invoice: 2 };
      return rank[customerActionFor(a)!] - rank[customerActionFor(b)!];
    })
    .slice(0, 5)
    .map((o) => {
      const action = customerActionFor(o);
      if (action === "artwork") {
        return {
          key: o.id,
          href: kontoPeekHref("/konto", o.orderNo, { steg: "artwork" }),
          label: `${o.orderNo} saknar artwork`,
          detail: "Utan artwork kan vi inte skicka korrektur.",
        };
      }
      if (action === "proof") {
        return {
          key: o.id,
          href: kontoPeekHref("/konto", o.orderNo, { steg: "korr" }),
          label: "Korrektur väntar på ditt godkännande",
          detail: o.orderNo,
        };
      }
      return {
        key: o.id,
        href: `/konto/fakturor?order=${o.orderNo}`,
        label: `${o.invoice?.invoiceNo ?? o.orderNo} förfaller ${o.invoice?.dueAt ? new Date(o.invoice.dueAt).toLocaleDateString("sv-SE") : ""}`.trim(),
      };
    });

  const nextDelivery = orders
    .map((o) => o.aquaApprovedDelivery ?? o.preliminaryDate)
    .filter((d): d is string => Boolean(d && d >= today))
    .sort()[0];
  const spent = orders
    .filter((o) => o.lockedAt && o.createdAt.getFullYear() === year)
    .reduce((s, o) => s + orderValue(o), 0);
  const lastLocked = orders.find((o) => o.lockedAt);

  return (
    <DashPage>
      <PageHeader
        title={`Hej ${user.name?.split(" ")[0] ?? ""}`}
        subtitle="Vad som behövs av dig, sedan ordrar och snabblänkar."
        action={
          <LinkButton href="/konto/ordrar/ny" size="sm">
            Ny order
          </LinkButton>
        }
      />
      <NeedsAttention items={attention} />
      {firstOrder ? (
        <>
          <StepIndicator steps={POST_STEPS} current="artwork" />
          <EmptyState title="Tack för din order" body="Nästa steg är artwork." />
        </>
      ) : empty ? (
        <EmptyState
          title={user.customerId ? "Inga ordrar ännu" : "Det här är kundportalen"}
          body={
            user.customerId
              ? "Skapa en ny order eller beställ igen från en tidigare order."
              : "Du är inloggad som admin. Logga ut och använd kund@demo.aqua för att visa kundens yta."
          }
          action={user.customerId ? <LinkButton href="/konto/ordrar/ny">Ny order</LinkButton> : undefined}
        />
      ) : (
        <Reveal>
          <KpiStrip>
            <KpiCard
              label="Aktiva ordrar"
              value={orders.filter((o) => !DONE.has(o.currentStatus)).length}
              href="/konto/ordrar?view=active"
            />
            <KpiCard label="Väntar på dig" value={waiting.length} href="/konto/ordrar?view=action" />
            <KpiCard label="Nästa leverans" value={nextDelivery ?? "–"} />
            <KpiCard label="Beställt i år" value={`${spent.toLocaleString("sv-SE")} kr`} hint="Ex moms, låsta ordrar" />
          </KpiStrip>
        </Reveal>
      )}
      {!empty && !firstOrder ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="av-section-title">Senaste ordrar</h2>
            <Link href="/konto/ordrar" className="av-grow-link">
              Visa alla
            </Link>
          </div>
          <BuyerOrderTable
            rows={orders.slice(0, 5).map((o) => {
              const item = o.items[0];
              const hint = statusHint(o.currentStatus, hintFactsFromOrder(o), "CUSTOMER");
              return {
                href: kontoPeekHref("/konto", o.orderNo),
                orderNo: o.orderNo,
                spec: specFromOrderItem({
                  visualSpecJson: o.visualSpecJson,
                  item,
                  imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
                }),
                status: o.currentStatus,
                statusLabel: hint.label,
                delivery: o.aquaApprovedDelivery
                  ? `Leverans ${o.aquaApprovedDelivery}`
                  : o.preliminaryDate
                    ? `Preliminärt ${o.preliminaryDate}`
                    : null,
                actionHref: o.lockedAt ? `/konto/ordrar/${o.orderNo}/repeat` : null,
                actionLabel: o.lockedAt ? "Beställ igen" : null,
              };
            })}
          />
        </section>
      ) : null}
      {!empty ? (
        <QuickLinks
          links={[
            {
              href: lastLocked ? `/konto/ordrar/${lastLocked.orderNo}/repeat` : "/konto/ordrar/ny",
              label: "Beställ igen",
            },
            { href: "/konto/artwork", label: "Ladda upp artwork" },
            { href: "/konto/fakturor", label: "Fakturor" },
          ]}
        />
      ) : null}
      {peek ? (
        <KontoOrderPeek order={peek} role={user.role} closeHref="/konto" steg={peekSteg} />
      ) : null}
    </DashPage>
  );
}
