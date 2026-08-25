import Link from "next/link";
import { listAllOrders } from "@/server/services/order.service";
import { weekProduction } from "@/server/services/production.service";
import { KpiCard } from "@/ui/shell/primitives";
import { PIPELINE_PHASES } from "@/domain/enums";

export default async function OpsHome() {
  const orders = await listAllOrders();
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() + 1);
  start.setHours(0, 0, 0, 0);
  const jobs = await weekProduction(start);
  const bottles = jobs.reduce((s, j) => s + j.order.items.reduce((a, i) => a + i.qty, 0), 0);
  const missingArt = orders.filter((o) => o.currentStatus === "ORDER_RECEIVED").length;
  const labelsShip = orders.filter((o) => o.currentStatus === "LABELS_PRINTED").length;
  const waybill = orders.filter((o) => o.currentStatus === "PRODUCTION_DONE").length;
  const late = orders.filter((o) => o.currentStatus === "PRODUCTION_PLANNED").length;

  const byDay = new Map<string, { size33: number; size50: number; still: number; spark: number }>();
  for (const job of jobs) {
    const day = job.plannedAt ? job.plannedAt.toLocaleDateString("sv-SE", { weekday: "long" }) : "okänd";
    const row = byDay.get(day) ?? { size33: 0, size50: 0, still: 0, spark: 0 };
    for (const item of job.order.items) {
      const ml = item.variant.volumeMl ?? 0;
      if (ml <= 330) row.size33 += item.qty;
      else row.size50 += item.qty;
      const opt = JSON.parse(item.variant.optionsJson || "{}") as { waterType?: string };
      if (opt.waterType === "kolsyrat") row.spark += item.qty;
      else row.still += item.qty;
    }
    byDay.set(day, row);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Kommande produktion</h1>
      <p className="mt-1 text-[var(--av-text-secondary)]">Den här veckan · {bottles.toLocaleString("sv-SE")} flaskor</p>
      <div className="mt-6 overflow-hidden rounded-2xl bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-[var(--av-text-muted)]">
            <tr>
              <th className="px-4 py-3">Produktion</th>
              <th className="text-right">33 cl</th>
              <th className="text-right">50 cl</th>
              <th className="text-right">Stilla</th>
              <th className="text-right">Kolsyrat</th>
            </tr>
          </thead>
          <tbody>
            {[...byDay.entries()].map(([day, r]) => (
              <tr key={day} className="border-t">
                <td className="px-4 py-2 capitalize">{day}</td>
                <td className="text-right">{r.size33 || "–"}</td>
                <td className="text-right">{r.size50 || "–"}</td>
                <td className="text-right">{r.still || "–"}</td>
                <td className="text-right">{r.spark || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-10 text-2xl font-semibold">Behöver åtgärd idag</h2>
      <ul className="mt-4 space-y-2">
        <li>
          <Link href="/operations/ordrar?phase=awaiting_artwork" className="block rounded-2xl bg-white p-4">
            {missingArt} ordrar saknar godkänt artwork
          </Link>
        </li>
        <li>
          <Link href="/operations/etiketter" className="block rounded-2xl bg-white p-4">
            {labelsShip} etikettordrar behöver skickas
          </Link>
        </li>
        <li>
          <Link href="/operations/ordrar?phase=ready_ship" className="block rounded-2xl bg-white p-4">
            {waybill} leveranser saknar fraktsedel
          </Link>
        </li>
        <li>
          <Link href="/operations/produktion" className="block rounded-2xl bg-white p-4">
            {late} produktioner riskerar att bli försenade
          </Link>
        </li>
      </ul>
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {PIPELINE_PHASES.map((p) => (
          <KpiCard
            key={p.id}
            label={p.label}
            value={orders.filter((o) => (p.statuses as readonly string[]).includes(o.currentStatus)).length}
            href={`/operations/ordrar?phase=${p.id}`}
          />
        ))}
      </div>
    </div>
  );
}
