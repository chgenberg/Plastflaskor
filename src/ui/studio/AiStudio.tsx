"use client";

import { useState } from "react";
import { aiGenerateAction, aiRefineAction } from "@/actions";

type Proposal = {
  id: string;
  tone: "minimal" | "bold" | "event";
  title: string;
  notes: string;
  canvas: { background: string; logoScale: number; qr: boolean };
};

export function AiStudio({ productName }: { productName: string }) {
  const [url, setUrl] = useState("https://example.se");
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [active, setActive] = useState<Proposal | null>(null);
  const [message, setMessage] = useState("");

  async function generate() {
    setLoading(true);
    const list = await aiGenerateAction(url, productName);
    setProposals(list);
    setActive(list[0]);
    setLoading(false);
  }

  async function refine() {
    if (!active) return;
    setLoading(true);
    const next = await aiRefineAction(message, active);
    setActive(next);
    setProposals((p) => p.map((x) => (x.id === next.id ? next : x)));
    setLoading(false);
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[var(--av-shadow-sm)]">
      <p className="text-xs font-medium uppercase text-[var(--av-accent)]">Simulerat</p>
      <h1 className="mt-2 text-3xl font-semibold">AI-designstudio</h1>
      <div className="mt-6 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} className="h-11 flex-1 rounded-xl border px-3" placeholder="Företagets hemsida" />
        <button onClick={generate} disabled={loading} className="rounded-xl bg-[var(--av-accent)] px-4 text-sm text-white">
          {loading ? "Hämtar…" : "Generera"}
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {proposals.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p)}
            className="rounded-2xl border p-4 text-left"
            style={{ background: p.canvas.background, color: p.canvas.background === "#FFFFFF" ? "#111" : "#fff" }}
          >
            <p className="font-semibold">{p.title}</p>
            <p className="mt-2 text-sm opacity-80">{p.notes}</p>
          </button>
        ))}
      </div>
      {active ? (
        <div className="mt-6">
          <div className="flex h-56 items-center justify-center rounded-2xl" style={{ background: active.canvas.background }}>
            <p className="text-2xl font-bold" style={{ transform: `scale(${active.canvas.logoScale})` }}>
              aqua
            </p>
            {active.canvas.qr ? <div className="ml-4 h-10 w-10 bg-black" /> : null}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Gör loggan större" className="h-11 flex-1 rounded-xl border px-3" />
            <button onClick={refine} className="rounded-xl border px-4 text-sm">
              Förfina
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
