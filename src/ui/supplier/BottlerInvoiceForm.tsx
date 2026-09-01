"use client";

import { useState } from "react";
import { createBottlerInvoiceAction } from "@/actions";
import { planLabels, type PlanCap, type PlanSize, type PlanWater } from "@/domain/bottlerPlan";
import { Button, controlClass } from "@/ui/shell/primitives";

export type BottlerInvoiceRow = {
  id: string;
  orderNo: string;
  customer: string;
  product: string;
  qty: number;
  size: PlanSize;
  water: PlanWater;
  cap: PlanCap;
  trackingNo: string;
};

export function BottlerInvoiceForm({ rows }: { rows: BottlerInvoiceRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const picked = rows.filter((r) => selected.includes(r.id));
  const totalQty = picked.reduce((sum, r) => sum + r.qty, 0);

  return (
    <form action={createBottlerInvoiceAction} className="space-y-4">
      <div className="av-table-wrap">
        <table className="av-table">
          <thead>
            <tr>
              <th>
                <span className="sr-only">Välj</span>
              </th>
              <th>Order</th>
              <th>Kund</th>
              <th>Innehåll</th>
              <th>Storlek</th>
              <th>Vatten</th>
              <th>Kork</th>
              <th>Spårning</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const labels = planLabels(r);
              return (
                <tr key={r.id}>
                  <td>
                    <input
                      type="checkbox"
                      name="jobIds"
                      value={r.id}
                      checked={selected.includes(r.id)}
                      onChange={(e) =>
                        setSelected((prev) => (e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)))
                      }
                      aria-label={`Välj ${r.orderNo}`}
                    />
                  </td>
                  <td className="font-semibold">{r.orderNo}</td>
                  <td>{r.customer}</td>
                  <td>
                    {r.product} · {r.qty.toLocaleString("sv-SE")} st
                  </td>
                  <td className="whitespace-nowrap">{labels.size}</td>
                  <td className="whitespace-nowrap">{labels.water}</td>
                  <td className="whitespace-nowrap">{labels.cap}</td>
                  <td className="tabular-nums">{r.trackingNo || "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="av-card space-y-3 px-4 py-4">
        <p className="text-[13px] font-semibold">Nytt fakturaunderlag</p>
        <p className="text-[12px] text-[var(--av-text-muted)]">
          Kryssa i skickade ordrar. De samlas under ett rapportnummer som underlag mot Aqua. Inga priser.
        </p>
        <label className="block space-y-1">
          <span className="av-label">Fritext</span>
          <textarea name="notes" rows={3} className={`${controlClass} h-auto min-h-[5.5rem] py-2`} />
        </label>
        <div className="rounded-[var(--av-radius-md)] bg-[var(--av-bg)] px-3 py-3 text-[13px]">
          <p className="font-semibold">I underlaget</p>
          {picked.length === 0 ? (
            <p className="mt-1 text-[var(--av-text-muted)]">Inga ordrar valda.</p>
          ) : (
            <p className="mt-1 tabular-nums">
              {picked.length} ordrar · {totalQty.toLocaleString("sv-SE")} flaskor
            </p>
          )}
        </div>
        <Button type="submit" disabled={picked.length === 0}>
          Skapa underlag
        </Button>
      </div>
    </form>
  );
}
