"use client";

import { useState } from "react";

const QTYS = [270, 500, 1000, 2500, 5000];

function tiersForMoq(moq: number) {
  const filtered = QTYS.filter((n) => n >= moq);
  return filtered.length ? filtered : [moq];
}

export function RepeatFields({
  defaultQty,
  prices,
  moq,
}: {
  defaultQty: number;
  prices: Record<number, number | null>;
  moq: number;
}) {
  const tiers = tiersForMoq(moq);
  const [qty, setQty] = useState(
    tiers.includes(defaultQty) ? defaultQty : (tiers.find((n) => n >= defaultQty) ?? tiers[0]),
  );
  const unit = prices[qty];
  return (
    <>
      <label className="block text-sm">
        Antal
        <select
          name="qty"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="mt-1 h-11 w-full rounded-xl border border-[var(--av-border-strong)] px-3"
        >
          {tiers.map((n) => (
            <option key={n} value={n}>
              {n} st
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-[var(--av-text-muted)]">
        {unit != null
          ? `Nettopris vid ${qty} st: ${unit.toFixed(2)} kr/st · ${(unit * qty).toLocaleString("sv-SE")} kr`
          : `Kontakta oss för pris vid ${qty} st.`}
      </p>
    </>
  );
}
