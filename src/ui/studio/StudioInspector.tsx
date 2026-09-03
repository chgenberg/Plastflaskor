"use client";

import type { ReactNode } from "react";
import type { Finish, Layer, StudioPane, StudioProduct } from "./engine/types";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="av-label">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="text-[10px] text-[var(--av-text-muted)]">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-9 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-2 text-xs"
      />
    </label>
  );
}

export function StudioInspector({
  pane,
  layers,
  selected,
  finish,
  product,
  waterType,
  cap,
  placedReqs,
  wrap,
  printFiles,
  onWaterType,
  onCap,
  onToggleReq,
  onSelect,
  onFinish,
  onLayerChange,
  onUpload,
  onPrintFile,
}: {
  pane: StudioPane;
  layers: Layer[];
  selected: Layer;
  finish: Finish;
  product?: StudioProduct;
  waterType: "stilla" | "kolsyrat";
  cap: "skruvkork" | "sportkork" | "black" | "white";
  placedReqs: Record<string, boolean>;
  wrap: { widthMm: number; heightMm: number; bleedMm: number };
  printFiles: string[];
  onWaterType: (v: "stilla" | "kolsyrat") => void;
  onCap: (v: "skruvkork" | "sportkork" | "black" | "white") => void;
  onToggleReq: (code: string, placed: boolean) => void;
  onSelect: (id: string) => void;
  onFinish: (f: Finish) => void;
  onLayerChange: (id: string, patch: Partial<Layer>) => void;
  onUpload: (src: string, target: "logo" | "artwork") => void;
  onPrintFile: (name: string) => void;
}) {
  return (
    <div className="space-y-5 text-sm">
      {pane === "add" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="av-label">Lägg till</p>
            <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-[var(--av-radius-lg)] border border-dashed border-[var(--av-border-strong)] px-4 text-center text-[13px] text-[var(--av-text-muted)]">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp,.pdf,.ai"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const ext = file.name.split(".").pop()?.toLowerCase();
                  if (ext === "pdf" || ext === "ai") {
                    onPrintFile(file.name);
                    return;
                  }
                  const target = selected.type === "artwork" ? "artwork" : "logo";
                  const reader = new FileReader();
                  reader.onload = () => onUpload(String(reader.result), target);
                  reader.readAsDataURL(file);
                }}
              />
              <span className="font-medium text-[var(--av-text)]">Släpp logotyp eller artwork</span>
              <span className="mt-1 text-[12px]">PNG, JPG, SVG, PDF eller AI</span>
            </label>
          </div>
          <label className="block">
            <span className="av-label">Text</span>
            <input
              value={layers.find((l) => l.type === "text")?.text ?? ""}
              onChange={(e) => {
                onSelect("text");
                onLayerChange("text", { text: e.target.value });
              }}
              className="mt-2 h-10 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3"
              placeholder="Skriv på etiketten"
            />
          </label>
          <label className="block">
            <span className="av-label">QR-länk</span>
            <input
              value={layers.find((l) => l.type === "qr")?.text ?? ""}
              onChange={(e) => {
                onSelect("qr");
                onLayerChange("qr", { text: e.target.value });
              }}
              className="mt-2 h-10 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3"
              placeholder="https://"
            />
          </label>
          {printFiles.length ? (
            <ul className="space-y-1 text-[12px] text-[var(--av-text-muted)]">
              {printFiles.map((name) => (
                <li key={name}>Fil: {name}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {pane === "layers" ? (
        <section>
          <p className="av-label">Lager</p>
          <ul className="mt-2 space-y-1">
            {[...layers].reverse().map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onSelect(l.id)}
                  className={`w-full rounded-[var(--av-radius-md)] px-3 py-2 text-left ${selected.id === l.id ? "bg-[var(--av-accent-soft)] text-[var(--av-accent)]" : "hover:bg-[var(--av-bg)]"}`}
                >
                  {l.name}
                </button>
              </li>
            ))}
          </ul>
          {selected.type !== "artwork" ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Num label="Position" value={Math.round(selected.x)} onChange={(v) => onLayerChange(selected.id, { x: v })} />
              <Num label="Skala" value={Number(selected.scale.toFixed(1))} step={0.1} onChange={(v) => onLayerChange(selected.id, { scale: v })} />
              <Num label="Vridning" value={selected.rotation} onChange={(v) => onLayerChange(selected.id, { rotation: v })} />
            </div>
          ) : null}
        </section>
      ) : null}

      {pane === "bottle" ? (
        <div className="space-y-3">
          <div>
            <p className="av-label">Flaska</p>
            <p className="mt-1.5 text-sm">{product?.name}</p>
            <p className="mt-1 text-[12px] text-[var(--av-text-muted)]">
              Etikett {wrap.widthMm} × {wrap.heightMm} mm + {wrap.bleedMm} mm bleed
            </p>
          </div>
          <Field label="Stilla / kolsyrat">
            <select
              value={waterType}
              onChange={(e) => onWaterType(e.target.value as "stilla" | "kolsyrat")}
              className="h-10 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3"
            >
              <option value="stilla">Stilla</option>
              <option value="kolsyrat">Kolsyrat</option>
            </select>
          </Field>
          <Field label="Kapsyl">
            <select
              value={cap}
              onChange={(e) => onCap(e.target.value as "skruvkork" | "sportkork" | "black" | "white")}
              className="h-10 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3"
            >
              <option value="skruvkork">Svart kapsyl</option>
              <option value="white">Vit kapsyl</option>
              <option value="sportkork">Sportkork</option>
            </select>
          </Field>
          <div>
            <p className="av-label">Etikettfinish</p>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-[var(--av-radius-md)] bg-[var(--av-bg)] p-1">
              {(["matte", "gloss"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onFinish(f)}
                  className={`rounded-[var(--av-radius-sm)] py-1.5 text-xs font-medium ${finish === f ? "bg-white shadow-sm" : "text-[var(--av-text-muted)]"}`}
                >
                  {f === "matte" ? "Matt" : "Blank"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {pane === "reqs" ? (
        <div>
          <p className="av-label">Tryckkrav</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {(product?.printRequirements ?? []).map((r) => (
              <li key={r.code}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(placedReqs[r.code])}
                    onChange={(e) => {
                      onToggleReq(r.code, e.target.checked);
                      if (r.code.includes("logo")) onSelect("logo");
                      else if (r.code.includes("qr")) onSelect("qr");
                      else onSelect("artwork");
                    }}
                  />
                  <span>
                    {r.label}
                    {r.required ? " *" : ""}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-[var(--av-text-muted)]">Kryssa i när elementet sitter på etiketten.</p>
        </div>
      ) : null}
    </div>
  );
}
