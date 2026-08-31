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
  lockedCopy = "Kontakta AquaVisibility.",
}: {
  spec: VisualSpec | null;
  extras: ExtraLine[];
  snapshot?: PriceSnapshot | null;
  confirmedDate?: string | null;
  repeatHorizonMonths?: number | null;
  locked?: boolean;
  showPrices?: boolean;
  lockedCopy?: string;
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
      {spec ? <VisualSpecCard spec={spec} /> : null}
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="av-label">Bekräftat leveransdatum</dt>
          <dd className="mt-1 font-medium">{confirmedDate ?? "Välj datum nedan"}</dd>
        </div>
        <div>
          <dt className="av-label">Förväntad återbeställning</dt>
          <dd className="mt-1 font-medium">{horizon ?? "Anges innan OB skickas"}</dd>
        </div>
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
