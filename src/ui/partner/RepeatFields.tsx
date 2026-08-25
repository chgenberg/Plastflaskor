"use client";

import { useState } from "react";

const QTYS = [270, 540, 1080, 2500, 5000];

export function RepeatFields({
  defaultQty,
  prices,
}: {
  defaultQty: number;
  prices: Record<number, number | null>;
}) {
  const [qty, setQty] = useState(QTYS.includes(defaultQty) ? defaultQty : QTYS[0]);
  const unit = prices[qty];
  return (
    <>
      <label className="block text-sm">
        Antal
        <select
          name="qty"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3"
        >
          {QTYS.map((n) => (
            <option key={n} value={n}>
              {n} st
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-[#6b7280]">
        {unit != null
          ? `Nettopris vid ${qty} st: ${unit.toFixed(2)} kr/st · ${(unit * qty).toLocaleString("sv-SE")} kr`
          : `Kontakta oss för pris vid ${qty} st.`}
      </p>
    </>
  );
}
