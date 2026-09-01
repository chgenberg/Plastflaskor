"use client";

import { useMemo, useState } from "react";
import { receiveLabelDispatchAction } from "@/actions";
import type { InboundDispatchDetail } from "@/server/services/labelDispatch.service";
import { Button, LinkButton, controlClass } from "@/ui/shell/primitives";

export function ReceiveDispatchForm({ detail }: { detail: InboundDispatchDetail }) {
  const pending = detail.lines.filter((l) => l.canReceive);
  const [selected, setSelected] = useState<string[]>([]);
  const [deviation, setDeviation] = useState(detail.deviationNote);
  const picked = pending.filter((l) => selected.includes(l.id));
  const allIn = pending.length > 0 && picked.length === pending.length;
  const needsDeviation = picked.length < pending.length;

  const summary = useMemo(() => {
    const qty = picked.reduce((sum, l) => sum + l.qty, 0);
    return `${picked.length} av ${pending.length} ordrar · ${qty.toLocaleString("sv-SE")} etiketter`;
  }, [picked, pending.length]);

  if (detail.receivedAt) {
    return (
      <div className="av-card px-4 py-3 text-[13px]">
        <p className="font-semibold text-[var(--av-status-done-fg)]">{detail.reportNo} inlevererad</p>
        {detail.deviationNote ? (
          <p className="mt-1 text-[var(--av-text-secondary)]">Avvikelse: {detail.deviationNote}</p>
        ) : null}
        <p className="mt-2">
          <LinkButton href="/bottler" variant="secondary" size="sm">
            Tillbaka
          </LinkButton>
        </p>
      </div>
    );
  }

  return (
    <form action={receiveLabelDispatchAction} className="space-y-4">
      <input type="hidden" name="reportNo" value={detail.reportNo} />
      <div className="av-table-wrap">
        <table className="av-table">
          <thead>
            <tr>
              <th>
                <span className="sr-only">I leveransen</span>
              </th>
              <th>Ordernr</th>
              <th>Kund</th>
              <th className="av-num">Antal</th>
            </tr>
          </thead>
          <tbody>
            {detail.lines.map((l) => (
              <tr key={l.id} className={l.received ? "av-row-shipped" : undefined}>
                <td>
                  {l.canReceive ? (
                    <input
                      type="checkbox"
                      name="lineIds"
                      value={l.id}
                      checked={selected.includes(l.id)}
                      onChange={(e) =>
                        setSelected((prev) => (e.target.checked ? [...prev, l.id] : prev.filter((id) => id !== l.id)))
                      }
                      aria-label={`Bekräfta ${l.orderNo}`}
                    />
                  ) : (
                    <span className="text-[12px] text-[var(--av-text-muted)]">{l.received ? "Mottagen" : "–"}</span>
                  )}
                </td>
                <td className="font-semibold">{l.orderNo}</td>
                <td>{l.customerName}</td>
                <td className="av-num tabular-nums">{l.qty.toLocaleString("sv-SE")} st</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] tabular-nums text-[var(--av-text-secondary)]">{summary}</p>
      <label className="block space-y-1">
        <span className="av-label">Avvikelse mot inleverans{needsDeviation ? " (obligatorisk)" : ""}</span>
        <textarea
          name="deviationNote"
          rows={3}
          required={needsDeviation}
          value={deviation}
          onChange={(e) => setDeviation(e.target.value)}
          placeholder="T.ex. en order saknas, skadat gods, fel antal"
          className={`${controlClass} h-auto min-h-[5.5rem] py-2`}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending.length === 0 && !deviation.trim() && picked.length === 0}>
          {allIn ? "Godkänn inleverans" : "Godkänn inleverans med avvikelse"}
        </Button>
        <LinkButton href="/bottler" variant="secondary">
          Avbryt
        </LinkButton>
      </div>
    </form>
  );
}
