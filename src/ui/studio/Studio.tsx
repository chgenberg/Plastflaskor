"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { saveDesignAction } from "@/actions";
import { assertRequiredPrintPlaced, emptyCupDocument, REQUIRED_PRINT_MESSAGE } from "@/domain/cupDocument";
import { BottlePreview } from "./engine/BottlePreview";
import { LabelCanvas } from "./engine/LabelCanvas";
import { defaultLayers, skuLabel, wrapForVolume, type Finish, type Layer, type StudioProduct, type Tool } from "./engine/types";

const STEPS = [
  { id: "product", label: "Produkt" },
  { id: "upload", label: "Ladda upp" },
  { id: "design", label: "Design" },
  { id: "preview", label: "Förhandsvisning" },
] as const;

const TOOLS: { id: Tool; label: string }[] = [
  { id: "design", label: "Designa" },
  { id: "text", label: "Text" },
  { id: "upload", label: "Ladda upp" },
  { id: "colors", label: "Färger" },
  { id: "bottle", label: "Flaska" },
  { id: "preview", label: "Förhandsvisa" },
];

export function Studio({
  products,
  initialSlug,
  role,
}: {
  products: StudioProduct[];
  initialSlug?: string;
  role?: string | null;
}) {
  const isBuyer = role === "CUSTOMER";
  const router = useRouter();
  const preferred = products.find((p) => p.slug === initialSlug) ?? products.find((p) => p.slug.includes("33cl")) ?? products[0];
  const [slug, setSlug] = useState(preferred?.slug);
  const product = products.find((p) => p.slug === slug) ?? products[0];
  const [qty, setQty] = useState(product?.moq ?? 270);
  const [finish, setFinish] = useState<Finish>("matte");
  const [waterType, setWaterType] = useState<"stilla" | "kolsyrat">("stilla");
  const [cap, setCap] = useState<"skruvkork" | "sportkork" | "black" | "white">("skruvkork");
  const [placedReqs, setPlacedReqs] = useState<Record<string, boolean>>({});
  const [project, setProject] = useState("AQUA VISIBILITY / SS26");
  const [tool, setTool] = useState<Tool>("upload");
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [selectedId, setSelectedId] = useState("artwork");
  const [zoom2d, setZoom2d] = useState(1);
  const [saved, setSaved] = useState(true);
  const [picker, setPicker] = useState(false);
  const [view, setView] = useState<"wrap" | "vinklar">("wrap");
  const [yaw, setYaw] = useState(18);
  const [printFiles, setPrintFiles] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [gateError, setGateError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const history = useRef<Layer[][]>([defaultLayers()]);
  const future = useRef<Layer[][]>([]);
  const [, start] = useTransition();
  const selected = layers.find((l) => l.id === selectedId) ?? layers[0];

  const wrap = useMemo(() => product?.wrap ?? wrapForVolume(product?.volumeMl), [product?.wrap, product?.volumeMl]);
  const requirements = useMemo(
    () =>
      (product?.printRequirements ?? []).map((r) => ({
        code: r.code,
        label: r.label,
        required: r.required,
        placed: Boolean(placedReqs[r.code]),
      })),
    [product, placedReqs],
  );
  const cupDoc = useMemo(
    () =>
      emptyCupDocument({
        productSlug: product.slug,
        variantSku: product.variantSku,
        quantity: qty,
        finish: finish === "gloss" ? "glossy" : "matte",
        wrap,
        layers: layers as unknown as Record<string, unknown>[],
        requirements,
      }),
    [product.slug, product.variantSku, qty, finish, wrap, layers, requirements],
  );
  const options = useMemo(
    () => JSON.stringify({ ...cupDoc.options, waterType, cap }),
    [cupDoc, waterType, cap],
  );
  function pushHistory(next: Layer[]) {
    history.current = [...history.current, layers].slice(-30);
    future.current = [];
    setLayers(next);
    setSaved(false);
  }

  function updateLayer(id: string, patch: Partial<Layer>, record = true) {
    const next = layers.map((l) => (l.id === id ? { ...l, ...patch } : l));
    if (record) pushHistory(next);
    else setLayers(next);
  }

  function undo() {
    if (history.current.length < 2) return;
    const prev = history.current[history.current.length - 1];
    history.current = history.current.slice(0, -1);
    future.current = [layers, ...future.current];
    setLayers(prev);
  }

  function redo() {
    const next = future.current[0];
    if (!next) return;
    future.current = future.current.slice(1);
    history.current = [...history.current, layers];
    setLayers(next);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const t = setTimeout(() => setSaved(true), 700);
    return () => clearTimeout(t);
  }, [layers, qty, finish, placedReqs, project]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!pickerRef.current?.contains(e.target as Node)) setPicker(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function persistDesign() {
    assertRequiredPrintPlaced(requirements);
    setGateError(null);
    return saveDesignAction({
      productId: product.id,
      projectName: project,
      quantity: qty,
      optionsJson: options,
      canvasJson: JSON.stringify({ layers, finish, printFiles, wrap: cupDoc.wrap }),
      cupDocumentJson: JSON.stringify(cupDoc),
    });
  }

  function addToOrder() {
    start(async () => {
      try {
        const design = await persistDesign();
        router.push(`/konto/ordrar/ny?design=${design.id}`);
      } catch (err) {
        setGateError(err instanceof Error ? err.message : REQUIRED_PRINT_MESSAGE);
      }
    });
  }

  function resetDesign() {
    const nextLayers = defaultLayers();
    history.current = [nextLayers];
    future.current = [];
    setLayers(nextLayers);
    setSelectedId("artwork");
    setPrintFiles([]);
    setFinish("matte");
    setPlacedReqs({});
    setQty(product.moq);
    setSaved(false);
  }

  function goStep(i: number) {
    setStep(i);
    const id = STEPS[i].id;
    if (id === "product") setPicker(true);
    if (id === "upload") {
      setTool("upload");
      setView("wrap");
    }
    if (id === "design") {
      setTool("design");
      setView("wrap");
    }
    if (id === "preview") {
      setTool("preview");
      setView("vinklar");
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-[var(--av-bg)] text-[var(--av-text)]">
      <header className="relative z-50 grid h-20 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-black/5 bg-white/80 px-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center py-2.5">
            <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={108} height={34} className="h-9 w-auto" />
          </Link>
          <input
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="hidden max-w-[220px] truncate bg-transparent av-label outline-none md:block"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--av-text-muted)]">
            <span className={`h-1.5 w-1.5 rounded-full ${saved ? "bg-emerald-500" : "bg-amber-400"}`} />
            Autosparar
          </span>
          <button type="button" onClick={undo} className="flex h-8 w-8 items-center justify-center rounded-[var(--av-radius-md)] hover:bg-[var(--av-bg)]" aria-label="Ångra">
            ↩
          </button>
          <button type="button" onClick={redo} className="flex h-8 w-8 items-center justify-center rounded-[var(--av-radius-md)] hover:bg-[var(--av-bg)]" aria-label="Gör om">
            ↪
          </button>
        </div>
        <div className="flex items-center justify-end gap-3">
          <div className="relative" ref={pickerRef}>
            <button type="button" onClick={() => setPicker((v) => !v)} className="h-9 rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] bg-white px-3 text-[12px] font-medium">
              {skuLabel(product)}
            </button>
            {picker ? (
              <div className="av-card absolute right-0 top-11 z-50 max-h-72 w-72 overflow-auto p-2">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSlug(p.slug);
                      setQty(p.moq);
                      setPlacedReqs({});
                      setPicker(false);
                    }}
                    className="block w-full rounded-[var(--av-radius-md)] px-3 py-2 text-left text-sm hover:bg-[var(--av-bg)]"
                  >
                    <span className="font-medium">{skuLabel(p)}</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--av-text-muted)]">{p.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" onClick={resetDesign} className="hidden h-9 rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3 text-[12px] font-medium sm:inline-flex sm:items-center">
            Återställ
          </button>
          {isBuyer ? (
            <button type="button" onClick={addToOrder} className="h-9 rounded-[var(--av-radius-md)] bg-[var(--av-accent)] px-5 text-[13px] font-semibold text-white hover:bg-[var(--av-accent-hover)]">
              Spara och beställ
            </button>
          ) : (
            <Link href="/operations" className="inline-flex h-9 items-center rounded-[var(--av-radius-md)] bg-[var(--av-accent)] px-5 text-[13px] font-semibold text-white hover:bg-[var(--av-accent-hover)]">
              Tillbaka till drift
            </Link>
          )}
        </div>
      </header>
      {gateError ? (
        <p className="shrink-0 border-b border-red-100 bg-red-50 px-5 py-2 text-center text-[13px] text-red-700">
          {gateError}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[84px] shrink-0 flex-col items-center gap-1 border-r border-black/5 bg-white/70 py-4 md:flex">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTool(t.id);
                if (t.id === "preview") setView("vinklar");
                else setView("wrap");
              }}
              className={`flex w-[68px] flex-col items-center gap-1 rounded-2xl py-3 text-[11px] font-medium ${
                tool === t.id ? "bg-[var(--av-accent-soft)] text-[var(--av-accent)]" : "text-[var(--av-text-muted)] hover:bg-[var(--av-bg)]"
              }`}
            >
              <ToolIcon id={t.id} />
              {t.label}
            </button>
          ))}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-auto p-3 lg:flex-row lg:overflow-hidden">
          <section className="flex min-h-[420px] min-w-0 flex-1 flex-col rounded-[var(--av-radius-lg)] bg-white shadow-[var(--av-shadow-sm)]">
            <ol className="flex gap-1 overflow-x-auto px-4 pt-3 text-[11px] font-medium">
              {STEPS.map((s, i) => (
                <li key={s.id} className="flex items-center gap-1">
                  {i > 0 ? <span className="text-[var(--av-gray-200)]">→</span> : null}
                  <button
                    type="button"
                    onClick={() => goStep(i)}
                    className={`rounded-[var(--av-radius-md)] px-2.5 py-1 ${step === i ? "bg-[var(--av-accent-soft)] text-[var(--av-accent)]" : "text-[var(--av-text-muted)] hover:bg-[var(--av-bg)]"}`}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
            <PaneToggle
              active={view}
              onWrap={() => {
                setView("wrap");
                if (tool === "preview") setTool("design");
              }}
              onAngles={() => {
                setView("vinklar");
                setTool("preview");
              }}
            />
            <div className="relative min-h-0 flex-1">
              {view === "vinklar" ? (
                <div className="absolute inset-0 px-4 pb-4 pt-2">
                  <BottlePreview
                    categorySlug={product.categorySlug}
                    productSlug={product.slug}
                    volumeMl={product.volumeMl}
                    cap={cap}
                    finish={finish}
                    yaw={yaw}
                    zoom={1}
                    layers={layers}
                    onYaw={setYaw}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 px-4 pb-4 pt-2">
                  <LabelCanvas
                    layers={layers}
                    selectedId={selectedId}
                    zoom={zoom2d}
                    onSelect={setSelectedId}
                    onMove={(id, x, y) => updateLayer(id, { x, y })}
                    onScale={(id, scale) => updateLayer(id, { scale })}
                    onDelete={() => {
                      if (selected.type === "artwork") return;
                      updateLayer(
                        selected.id,
                        selected.type === "text" || selected.type === "qr"
                          ? { text: "" }
                          : { x: 50, y: 46, scale: 1, rotation: 0 },
                      );
                    }}
                    onZoom={setZoom2d}
                  />
                </div>
              )}
            </div>
          </section>

          <aside className="w-full shrink-0 overflow-y-auto rounded-[var(--av-radius-lg)] bg-white p-4 shadow-[var(--av-shadow-sm)] lg:w-[280px]">
            <Inspector
              tool={tool}
              layers={layers}
              selected={selected}
              finish={finish}
              product={product}
              waterType={waterType}
              cap={cap}
              placedReqs={placedReqs}
              wrap={wrap}
              onWaterType={setWaterType}
              onCap={setCap}
              onToggleReq={(code, placed) => {
                setPlacedReqs((prev) => ({ ...prev, [code]: placed }));
                setGateError(null);
              }}
              onSelect={setSelectedId}
              onFinish={setFinish}
              onLayerChange={(id, patch) => updateLayer(id, patch)}
              onCenter={() => updateLayer(selected.id, { x: 50, y: selected.type === "logo" ? 46 : 70, rotation: 0 })}
              onUpload={(src) => updateLayer(selected.type === "logo" ? "logo" : "artwork", { src })}
              onPrintFile={(name) => setPrintFiles((prev) => [...prev, name])}
              printFiles={printFiles}
              onReset={resetDesign}
            />
          </aside>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-black/5 bg-white px-3 py-2 md:hidden">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTool(t.id);
              if (t.id === "preview") setView("vinklar");
              else setView("wrap");
            }}
            className={`rounded-[var(--av-radius-md)] px-3 py-1.5 text-xs font-medium ${tool === t.id ? "bg-[var(--av-accent-soft)] text-[var(--av-accent)]" : "text-[var(--av-text-muted)]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Inspector({
  tool,
  layers,
  selected,
  finish,
  product,
  waterType,
  cap,
  placedReqs,
  wrap,
  onWaterType,
  onCap,
  onToggleReq,
  onSelect,
  onFinish,
  onLayerChange,
  onCenter,
  onUpload,
  onPrintFile,
  printFiles,
  onReset,
}: {
  tool: Tool;
  layers: Layer[];
  selected: Layer;
  finish: Finish;
  product?: StudioProduct;
  waterType: "stilla" | "kolsyrat";
  cap: "skruvkork" | "sportkork" | "black" | "white";
  placedReqs: Record<string, boolean>;
  wrap: { widthMm: number; heightMm: number; bleedMm: number };
  onWaterType: (v: "stilla" | "kolsyrat") => void;
  onCap: (v: "skruvkork" | "sportkork" | "black" | "white") => void;
  onToggleReq: (code: string, placed: boolean) => void;
  onSelect: (id: string) => void;
  onFinish: (f: Finish) => void;
  onLayerChange: (id: string, patch: Partial<Layer>) => void;
  onCenter: () => void;
  onUpload: (src: string) => void;
  onPrintFile: (name: string) => void;
  printFiles: string[];
  onReset: () => void;
}) {
  return (
    <div className="space-y-5 text-sm">
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
      </section>

      {tool === "text" || selected.type === "text" ? (
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
      ) : null}

      {selected.type === "qr" || tool === "upload" ? (
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
      ) : null}

      {tool === "upload" ? (
        <div className="space-y-2">
          <p className="av-label">Ladda upp artwork</p>
          <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-[var(--av-radius-lg)] border border-dashed border-[var(--av-border-strong)] px-4 text-center text-[13px] text-[var(--av-text-muted)]">
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
                const reader = new FileReader();
                reader.onload = () => onUpload(String(reader.result));
                reader.readAsDataURL(file);
              }}
            />
            <span className="font-medium text-[var(--av-text)]">
              {selected.type === "logo" ? "Ladda upp logotyp" : "Ladda upp artwork"}
            </span>
            <span className="mt-1 text-[12px]">PNG, JPG, SVG, PDF eller AI</span>
          </label>
          <p className="text-[12px] text-[var(--av-text-muted)]">Ladda upp er färdiga design. Justera sedan obligatoriska etikettelement.</p>
        </div>
      ) : null}
      {printFiles.length ? (
        <ul className="space-y-1 text-[12px] text-[var(--av-text-muted)]">
          {printFiles.map((name) => (
            <li key={name}>Artwork: {name}</li>
          ))}
        </ul>
      ) : null}

      {tool === "colors" ? (
        <label className="block">
          <span className="av-label">Textfärg</span>
          <input
            type="color"
            value={layers.find((l) => l.type === "text")?.color ?? "#0f172a"}
            onChange={(e) => {
              onSelect("text");
              onLayerChange("text", { color: e.target.value });
            }}
            className="mt-2 h-10 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)]"
          />
        </label>
      ) : null}

      {tool === "bottle" ? (
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
          <div>
            <p className="av-label">Regulatoriska etikettkrav</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {(product?.printRequirements ?? []).map((r) => (
                <li key={r.code}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(placedReqs[r.code])}
                      onChange={(e) => onToggleReq(r.code, e.target.checked)}
                    />
                    <span>
                      {r.label}
                      {r.required ? " *" : ""}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-[var(--av-text-muted)]">Kryssa i när elementet är placerat på etiketten.</p>
          </div>
        </div>
      ) : null}

      <section>
        <p className="av-label">Placering</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Num label="Position" value={Math.round(selected.x)} onChange={(v) => onLayerChange(selected.id, { x: v })} />
          <Num label="Skala" value={Number(selected.scale.toFixed(1))} step={0.1} onChange={(v) => onLayerChange(selected.id, { scale: v })} />
          <Num label="Vridning" value={selected.rotation} onChange={(v) => onLayerChange(selected.id, { rotation: v })} />
        </div>
      </section>

      <section>
        <p className="av-label">Hjälp</p>
        <div className="mt-2 space-y-1.5">
          <button type="button" onClick={onCenter} className="flex w-full items-center justify-between rounded-[var(--av-radius-md)] px-3 py-2 text-left text-[13px] hover:bg-[var(--av-bg)]">
            Centrera motiv
          </button>
          <button type="button" onClick={onReset} className="flex w-full items-center justify-between rounded-[var(--av-radius-md)] px-3 py-2 text-left text-[13px] hover:bg-[var(--av-bg)]">
            Återställ
          </button>
        </div>
      </section>
    </div>
  );
}

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

function PaneToggle({
  active,
  onWrap,
  onAngles,
}: {
  active: "wrap" | "vinklar";
  onWrap: () => void;
  onAngles: () => void;
}) {
  return (
    <div className="flex justify-center pt-4">
      <div className="inline-flex rounded-[var(--av-radius-md)] bg-[var(--av-bg)] p-1 text-[12px] font-medium">
        <button
          type="button"
          onClick={onWrap}
          className={`rounded-[var(--av-radius-sm)] px-4 py-1.5 ${active === "wrap" ? "bg-white text-[var(--av-text)] shadow-sm" : "text-[var(--av-text-muted)]"}`}
        >
          Etikett
        </button>
        <button
          type="button"
          onClick={onAngles}
          className={`rounded-[var(--av-radius-sm)] px-4 py-1.5 ${active === "vinklar" ? "bg-white text-[var(--av-text)] shadow-sm" : "text-[var(--av-text-muted)]"}`}
        >
          3D / vinklar
        </button>
      </div>
    </div>
  );
}

function ToolIcon({ id }: { id: Tool }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none" as const };
  if (id === "design")
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 14l3-3 3 2 2-3" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  if (id === "text")
    return (
      <svg {...common}>
        <path d="M6 7h12M12 7v11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  if (id === "upload")
    return (
      <svg {...common}>
        <path d="M12 16V6m0 0 4 4M12 6 8 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M5 16v2h14v-2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  if (id === "colors")
    return (
      <svg {...common}>
        <circle cx="9" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="15" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="15" r="3" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  if (id === "bottle")
    return (
      <svg {...common}>
        <path d="M8 8h8l-1 12H9L8 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8 8h8M9.5 8V6.5h5V8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
