"use client";

import { useMemo, useState } from "react";
import { PLAN_CAPS, PLAN_SIZES, PLAN_WATERS, planLabels, type PlanCap, type PlanSize, type PlanWater } from "@/domain/bottlerPlan";
import { LinkButton, RowHit, StatusChip, controlCompact } from "@/ui/shell/primitives";

export type BottlerJobRow = {
  id: string;
  href: string;
  orderNo: string;
  customer: string;
  product: string;
  qty: number;
  deadline: string | null;
  deadlineAccepted: boolean;
  status: string;
  statusLabel: string;
  size: PlanSize;
  water: PlanWater;
  cap: PlanCap;
};

export function BottlerJobsTable({ rows }: { rows: BottlerJobRow[] }) {
  const [size, setSize] = useState<PlanSize | "">("");
  const [water, setWater] = useState<PlanWater | "">("");
  const [cap, setCap] = useState<PlanCap | "">("");

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (!size || r.size === size) && (!water || r.water === water) && (!cap || r.cap === cap),
      ),
    [rows, size, water, cap],
  );

  const printHref =
    filtered.length > 0
      ? `/api/bottler/print-plan?ids=${filtered.map((r) => r.id).join(",")}`
      : "/api/bottler/print-plan?empty=1";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-end gap-2">
        <label className="min-w-[7rem] flex-1 space-y-1">
          <span className="av-label">Storlek</span>
          <select value={size} onChange={(e) => setSize(e.target.value as PlanSize | "")} className={controlCompact}>
            <option value="">Alla</option>
            {PLAN_SIZES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[7rem] flex-1 space-y-1">
          <span className="av-label">Vatten</span>
          <select value={water} onChange={(e) => setWater(e.target.value as PlanWater | "")} className={controlCompact}>
            <option value="">Alla</option>
            {PLAN_WATERS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[7rem] flex-1 space-y-1">
          <span className="av-label">Kork</span>
          <select value={cap} onChange={(e) => setCap(e.target.value as PlanCap | "")} className={controlCompact}>
            <option value="">Alla</option>
            {PLAN_CAPS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <LinkButton href={printHref} variant="primary" size="sm">
          Print all
        </LinkButton>
      </div>
      <p className="mb-2 text-[12px] tabular-nums text-[var(--av-text-muted)]">{filtered.length} jobb</p>
      <div className="av-table-wrap">
        <table className="av-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Kund</th>
              <th>Innehåll</th>
              <th>Storlek</th>
              <th>Vatten</th>
              <th>Kork</th>
              <th>Skickdatum</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <RowHit href={r.href}>{r.orderNo}</RowHit>
                </td>
                <td>{r.customer}</td>
                <td>
                  {r.product} · {r.qty.toLocaleString("sv-SE")} st
                </td>
                <td className="whitespace-nowrap">{planLabels(r).size}</td>
                <td className="whitespace-nowrap">{planLabels(r).water}</td>
                <td className="whitespace-nowrap">{planLabels(r).cap}</td>
                <td className="whitespace-nowrap text-[var(--av-text-secondary)]">
                  {r.deadline ? `${r.deadline}${r.deadlineAccepted ? " · accepterad" : ""}` : "–"}
                </td>
                <td>
                  <StatusChip status={r.status} label={r.statusLabel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
