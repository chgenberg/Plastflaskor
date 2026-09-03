"use client";

import { useState } from "react";
import Link from "next/link";

export function NeedsAttention({
  title = "Kräver åtgärd",
  items,
}: {
  title?: string;
  items: { key: string; href: string; label: string; detail?: string }[];
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const count = items.length;
  const summary = count === 1 ? "1 sak väntar på dig" : `${count} saker väntar på dig`;

  return (
    <section className="av-attention">
      <div className="av-attention-bar">
        <div>
          <p className="av-label">{title}</p>
          <p className="av-attention-summary">{summary}</p>
        </div>
        <button
          type="button"
          className="av-attention-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Dölj" : "Visa"}
        </button>
      </div>
      {open ? (
        <ul>
          {items.map((item) => (
            <li key={item.key}>
              <Link href={item.href} className="av-attention-row">
                <span>
                  <strong>{item.label}</strong>
                  {item.detail ? <span className="av-attention-detail">{item.detail}</span> : null}
                </span>
                <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
