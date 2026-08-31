import type { ExtraLine, PriceSnapshot } from "@/domain/extras";
import type { VisualSpec } from "@/domain/visualSpec";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { Panel } from "@/ui/shell/primitives";

function sek(n: number) {
  return `${n.toLocaleString("sv-SE")} kr`;
}

export function OrderConfirmationPreview({
  spec,
  extras,
  snapshot,
  confirmedDate,
  repeatHorizonMonths,
  locked,
  showPrices = true,
  lockedCopy = "Ordern är godkänd och låst. Kontakta AquaVisibility för ändringar.",
  orderNo,
  customer,
  address,
  invoiceRef,
  artworkHref,
  artworkLabel,
}: {
  spec: VisualSpec | null;
  extras: ExtraLine[];
  snapshot?: PriceSnapshot | null;
  confirmedDate?: string | null;
  repeatHorizonMonths?: number | null;
  locked?: boolean;
  showPrices?: boolean;
  lockedCopy?: string;
  orderNo?: string;
  customer?: string;
  address?: string;
  invoiceRef?: string | null;
  artworkHref?: string | null;
  artworkLabel?: string | null;
}) {
  const goods = snapshot?.goodsExVat;
  const extrasEx = snapshot?.extrasExVat ?? extras.reduce((s, e) => s + e.amountExVat, 0);
  const total = snapshot?.amountExVat;
  const horizon =
    repeatHorizonMonths == null
      ? null
      : repeatHorizonMonths === 0
        ? "Ingen förväntad repeat"
        : `${repeatHorizonMonths} månader`;

  return (
    <Panel title={locked ? "Orderbekräftelse" : "Förhandsvisning av orderbekräftelse"}>
      {spec ? <VisualSpecCard spec={spec} hero={Boolean(locked)} /> : null}
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        {orderNo ? (
          <div>
            <dt className="av-label">Ordernummer</dt>
            <dd className="mt-1 font-mono font-medium">{orderNo}</dd>
          </div>
        ) : null}
        {customer ? (
          <div>
            <dt className="av-label">Kund</dt>
            <dd className="mt-1 font-medium">{customer}</dd>
          </div>
        ) : null}
        <div>
          <dt className="av-label">Bekräftat leveransdatum</dt>
          <dd className="mt-1 font-medium">{confirmedDate ?? "Välj datum nedan"}</dd>
        </div>
        <div>
          <dt className="av-label">Förväntad återbeställning</dt>
          <dd className="mt-1 font-medium">{horizon ?? "Anges innan OB skickas"}</dd>
        </div>
        {address ? (
          <div className="sm:col-span-2">
            <dt className="av-label">Leveransadress</dt>
            <dd className="mt-1 font-medium">{address}</dd>
          </div>
        ) : null}
        {invoiceRef ? (
          <div>
            <dt className="av-label">Fakturareferens</dt>
            <dd className="mt-1 font-medium">{invoiceRef}</dd>
          </div>
        ) : null}
        {artworkHref ? (
          <div>
            <dt className="av-label">Artwork / korrektur</dt>
            <dd className="mt-1">
              <a href={artworkHref} className="font-medium text-[var(--av-accent)]">
                {artworkLabel ?? "Öppna fil"}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
      {extras.length ? (
        <ul className="mt-4 space-y-1 text-sm">
          {extras.map((e) => (
            <li key={e.kind} className="flex justify-between gap-4">
              <span>{e.label}</span>
              {showPrices ? <span className="tabular-nums">{sek(e.amountExVat)}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--av-text-muted)]">Inga extrakostnader tillagda.</p>
      )}
      {showPrices && snapshot ? (
        <div className="mt-4 space-y-1 border-t border-[var(--av-border)] pt-4 text-sm">
          {snapshot.lines.map((l) => (
            <p key={l.name} className="flex justify-between gap-4">
              <span>
                {l.name} · {l.qty.toLocaleString("sv-SE")} st
              </span>
              <span className="tabular-nums">{sek(l.lineExVat)}</span>
            </p>
          ))}
          <p className="flex justify-between gap-4 text-[var(--av-text-muted)]">
            <span>Varor</span>
            <span className="tabular-nums">{sek(goods ?? 0)}</span>
          </p>
          <p className="flex justify-between gap-4 text-[var(--av-text-muted)]">
            <span>Tillägg</span>
            <span className="tabular-nums">{sek(extrasEx)}</span>
          </p>
          <p className="flex justify-between gap-4 text-lg font-semibold">
            <span>Totalt ex moms</span>
            <span className="tabular-nums">{sek(total ?? 0)}</span>
          </p>
          {snapshot.amountIncVat != null ? (
            <p className="flex justify-between gap-4 text-[var(--av-text-muted)]">
              <span>Totalt inkl. moms</span>
              <span className="tabular-nums">{sek(snapshot.amountIncVat)}</span>
            </p>
          ) : null}
        </div>
      ) : showPrices && extrasEx ? (
        <p className="mt-3 text-sm font-medium">Tillägg: {sek(extrasEx)} ex moms</p>
      ) : null}
      {locked ? <p className="mt-4 text-sm text-[var(--av-text-muted)]">{lockedCopy}</p> : null}
    </Panel>
  );
}
