"use client";

import { useMemo, useState } from "react";
import { createLabelDispatchAction } from "@/actions";
import { Button, LinkButton, RowHit, TableActions, controlClass } from "@/ui/shell/primitives";

export type LabelJobRow = {
  id: string;
  href: string;
  orderNo: string;
  orderName: string;
  material: string;
  deadline: string | null;
  qty: number;
  canMarkReady: boolean;
  canSelect: boolean;
  reportNo: string | null;
  actionLabel?: string;
};

type SortKey = "orderNo" | "orderName" | "material" | "deadline";

export function LabelJobsTable({
  rows,
  compose = false,
  highlightReport = null,
}: {
  rows: LabelJobRow[];
  compose?: boolean;
  highlightReport?: string | null;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "deadline", dir: "asc" });
  const [selected, setSelected] = useState<string[]>([]);
  const showReport = compose || rows.some((r) => r.reportNo);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const ar = a.reportNo || "";
      const br = b.reportNo || "";
      if (ar !== br) {
        if (!ar) return 1;
        if (!br) return -1;
        return br.localeCompare(ar, "sv");
      }
      const empty = sort.dir === "asc" ? "9999-12-31" : "";
      const av = sort.key === "deadline" ? a.deadline || empty : (a[sort.key] ?? "");
      const bv = sort.key === "deadline" ? b.deadline || empty : (b[sort.key] ?? "");
      const cmp = String(av).localeCompare(String(bv), "sv", { numeric: true, sensitivity: "base" });
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sort]);

  const picked = rows.filter((r) => selected.includes(r.id));
  const totalQty = picked.reduce((sum, r) => sum + r.qty, 0);
  const byMaterial = new Map<string, { orders: number; qty: number }>();
  for (const row of picked) {
    const cur = byMaterial.get(row.material) ?? { orders: 0, qty: 0 };
    cur.orders += 1;
    cur.qty += row.qty;
    byMaterial.set(row.material, cur);
  }

  function toggle(key: SortKey) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function toggleJob(id: string, on: boolean) {
    setSelected((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  const table = (
    <div>
      <p className="mb-2 text-[12px] tabular-nums text-[var(--av-text-muted)]">{rows.length} jobb</p>
      <div className="av-table-wrap">
        <table className="av-table">
          <thead>
            <tr>
              {compose ? (
                <th>
                  <span className="sr-only">Välj</span>
                </th>
              ) : null}
              <SortTh label="Ordernr" active={sort.key === "orderNo"} dir={sort.dir} onClick={() => toggle("orderNo")} />
              <SortTh label="Ordernamn" active={sort.key === "orderName"} dir={sort.dir} onClick={() => toggle("orderName")} />
              <SortTh label="Material" active={sort.key === "material"} dir={sort.dir} onClick={() => toggle("material")} />
              <SortTh label="Deadline" active={sort.key === "deadline"} dir={sort.dir} onClick={() => toggle("deadline")} />
              {showReport ? <th>Leveransrapport</th> : null}
              <th className="av-actions">
                <span className="sr-only">Åtgärd</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const shipped = Boolean(r.reportNo);
              const highlight = highlightReport && r.reportNo === highlightReport;
              return (
                <tr
                  key={r.id}
                  className={shipped ? `av-row-shipped${highlight ? " av-row-shipped-active" : ""}` : undefined}
                >
                  {compose ? (
                    <td>
                      {r.canSelect ? (
                        <input
                          type="checkbox"
                          name="jobIds"
                          value={r.id}
                          checked={selected.includes(r.id)}
                          onChange={(e) => toggleJob(r.id, e.target.checked)}
                          aria-label={`Välj ${r.orderNo}`}
                        />
                      ) : (
                        <span className="sr-only">Redan i rapport</span>
                      )}
                    </td>
                  ) : null}
                  <td>
                    <RowHit href={r.href}>{r.orderNo}</RowHit>
                  </td>
                  <td>{r.orderName}</td>
                  <td>{r.material}</td>
                  <td className="whitespace-nowrap tabular-nums text-[var(--av-text-secondary)]">{r.deadline ?? "–"}</td>
                  {showReport ? (
                    <td className="whitespace-nowrap font-medium tabular-nums">{r.reportNo ?? "–"}</td>
                  ) : null}
                  <td className="av-actions">
                    {!compose ? (
                      <TableActions>
                        <LinkButton href={r.href} size="lg">
                          {r.actionLabel ?? "Öppna"}
                        </LinkButton>
                      </TableActions>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!compose) return table;

  return (
    <form action={createLabelDispatchAction} className="space-y-4">
      {table}
      <div className="av-card space-y-3 px-4 py-4">
        <p className="text-[13px] font-semibold">Ny leveransrapport</p>
        <p className="text-[12px] text-[var(--av-text-muted)]">
          Kryssa i ordrarna som ska med. De samlas under ett rapportnummer som fakturaunderlag. Inga priser.
        </p>
        <label className="block space-y-1">
          <span className="av-label">Fritext</span>
          <textarea name="notes" rows={3} className={`${controlClass} h-auto min-h-[5.5rem] py-2`} />
        </label>
        <label className="block space-y-1">
          <span className="av-label">Trackingnummer</span>
          <input name="trackingNo" required className={controlClass} placeholder="Paketets trackingnummer" />
        </label>
        <div className="rounded-[var(--av-radius-md)] bg-[var(--av-bg)] px-3 py-3 text-[13px]">
          <p className="font-semibold">I frakten</p>
          {picked.length === 0 ? (
            <p className="mt-1 text-[var(--av-text-muted)]">Inga ordrar valda.</p>
          ) : (
            <ul className="mt-1 space-y-0.5 tabular-nums">
              <li>
                {picked.length} ordrar · {totalQty.toLocaleString("sv-SE")} etiketter
              </li>
              {[...byMaterial.entries()].map(([material, info]) => (
                <li key={material}>
                  {material}: {info.orders} ordrar, {info.qty.toLocaleString("sv-SE")} st
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={picked.length === 0}>
            Skapa leveransrapport
          </Button>
          <LinkButton href="/labels" variant="secondary">
            Avbryt
          </LinkButton>
        </div>
      </div>
    </form>
  );
}

function SortTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th>
      <button type="button" className="av-sort" onClick={onClick} aria-pressed={active}>
        {label}
        <span aria-hidden="true">{active ? (dir === "asc" ? "↑" : "↓") : ""}</span>
      </button>
    </th>
  );
}
