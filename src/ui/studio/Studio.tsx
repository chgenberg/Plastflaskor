"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { attachDesignToOrderAction, saveDesignAction } from "@/actions";
import { RealityView } from "./RealityView";
import { BottlePreview } from "./engine/BottlePreview";
import { flattenLabelBlob } from "./engine/flattenLabel";
import { LabelCanvas } from "./engine/LabelCanvas";
import { defaultLayers, skuLabel, type Finish, type Layer, type StudioProduct, type Tool } from "./engine/types";

const STEPS = [
  { id: "product", label: "Produkt" },
  { id: "options", label: "Val" },
  { id: "qty", label: "Antal" },
  { id: "upload", label: "Ladda upp" },
  { id: "design", label: "Design" },
  { id: "preview", label: "Förhandsvisning" },
  { id: "send", label: "Skicka" },
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
  const isReseller = role === "RESELLER";
  const router = useRouter();
  const preferred = products.find((p) => p.slug === initialSlug) ?? products.find((p) => p.slug.includes("50cl")) ?? products[0];
  const [slug, setSlug] = useState(preferred?.slug);
  const product = products.find((p) => p.slug === slug) ?? products[0];
  const [qty, setQty] = useState(product?.moq ?? 270);
  const [water, setWater] = useState("stilla");
  const [cap, setCap] = useState("skruvkork");
  const [label, setLabel] = useState("papper");
  const [finish, setFinish] = useState<Finish>("matte");
  const [project, setProject] = useState("AQUA VISIBILITY / SS26");
  const [tool, setTool] = useState<Tool>("design");
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [selectedId, setSelectedId] = useState("artwork");
  const [zoom2d, setZoom2d] = useState(1);
  const [saved, setSaved] = useState(true);
  const [picker, setPicker] = useState(false);
  const [view, setView] = useState<"etikett" | "vinklar" | "verklighet">("etikett");
  const [yaw, setYaw] = useState(18);
  const [printFiles, setPrintFiles] = useState<string[]>([]);
  const [step, setStep] = useState(4);
  const [realityUrl, setRealityUrl] = useState<string | null>(null);
  const [realityFp, setRealityFp] = useState<string | null>(null);
  const [realityLoading, setRealityLoading] = useState(false);
  const [realityError, setRealityError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const history = useRef<Layer[][]>([defaultLayers()]);
  const future = useRef<Layer[][]>([]);
  const [, start] = useTransition();
  const selected = layers.find((l) => l.id === selectedId) ?? layers[0];

  const options = useMemo(() => JSON.stringify({ water, cap, label, finish }), [water, cap, label, finish]);
  const realityKey = useMemo(
    () => JSON.stringify({ slug, water, cap, label, finish, layers }),
    [slug, water, cap, label, finish, layers],
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
  }, [layers, qty, water, cap, label, finish, project]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!pickerRef.current?.contains(e.target as Node)) setPicker(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function openRealityPane() {
    setView("verklighet");
    setTool("preview");
  }

  async function seeInReality() {
    openRealityPane();
    if (realityLoading) return;
    setRealityLoading(true);
    setRealityError(null);
    try {
      const blob = await flattenLabelBlob(layers);
      const fd = new FormData();
      fd.append("label", blob, "label.png");
      fd.append(
        "meta",
        JSON.stringify({
          productSlug: product.slug,
          productName: product.name,
          categorySlug: product.categorySlug,
          volumeMl: product.volumeMl ?? null,
          water,
          cap,
          labelKind: label,
          finish,
          projectName: project,
          extraText: layers.find((l) => l.type === "text")?.text ?? "",
        }),
      );
      const res = await fetch("/api/studio/reality", { method: "POST", body: fd });
      const data = (await res.json()) as { imageDataUrl?: string; error?: string };
      if (!res.ok || !data.imageDataUrl) throw new Error(data.error ?? "Kunde inte skapa bilden.");
      setRealityUrl(data.imageDataUrl);
      setRealityFp(realityKey);
    } catch (err) {
      setRealityError(err instanceof Error ? err.message : "Kunde inte skapa bilden.");
    } finally {
      setRealityLoading(false);
    }
  }

  function persistDesign() {
    return saveDesignAction({
      productId: product.id,
      projectName: project,
      quantity: qty,
      optionsJson: options,
      canvasJson: JSON.stringify({ layers, finish, printFiles }),
    });
  }

  function next() {
    start(async () => {
      const design = await persistDesign();
      router.push(`/kassa?product=${product.id}&design=${design.id}&qty=${qty}`);
    });
  }

  function requestQuote() {
    start(async () => {
      const design = await persistDesign();
      router.push(`/offert?product=${product.id}&design=${design.id}&qty=${qty}`);
    });
  }

  function addToOrder() {
    start(async () => {
      const design = await persistDesign();
      const order = await attachDesignToOrderAction(design.id);
      router.push(`/partner/ordrar/${order.orderNo}`);
    });
  }

  function resetDesign() {
    const nextLayers = defaultLayers();
    history.current = [nextLayers];
    future.current = [];
    setLayers(nextLayers);
    setSelectedId("artwork");
    setPrintFiles([]);
    setWater("stilla");
    setCap("skruvkork");
    setLabel("papper");
    setFinish("matte");
    setQty(product.moq);
    setSaved(false);
  }

  function goStep(i: number) {
    setStep(i);
    const id = STEPS[i].id;
    if (id === "product") setPicker(true);
    if (id === "options" || id === "qty") {
      setTool("bottle");
      setView("etikett");
    }
    if (id === "upload") {
      setTool("upload");
      setView("etikett");
    }
    if (id === "design") {
      setTool("design");
      setView("etikett");
    }
    if (id === "preview") {
      setTool("preview");
      setView("vinklar");
    }
    if (id === "send") setTool("preview");
  }

  const qtys = [product.moq, 540, 1080, 2500, 5000].filter((n, i, a) => n >= product.moq && a.indexOf(n) === i);

  return (
    <div className="flex h-dvh flex-col bg-[#F4F5F7] text-[#1d1d1f]">
      <header className="relative z-50 grid h-20 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-black/5 bg-white/80 px-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center py-2.5">
            <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={108} height={34} className="h-9 w-auto" />
          </Link>
          <input
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="hidden max-w-[220px] truncate bg-transparent text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280] outline-none md:block"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7280]">
            <span className={`h-1.5 w-1.5 rounded-full ${saved ? "bg-emerald-500" : "bg-amber-400"}`} />
            Autosparar
          </span>
          <button type="button" onClick={undo} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/[0.05]" aria-label="Ångra">
            ↩
          </button>
          <button type="button" onClick={redo} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/[0.05]" aria-label="Gör om">
            ↪
          </button>
        </div>
        <div className="flex items-center justify-end gap-3">
          <div className="relative" ref={pickerRef}>
            <button type="button" onClick={() => setPicker((v) => !v)} className="h-9 rounded-full border border-black/10 bg-white px-3 text-[12px] font-medium">
              {skuLabel(product)}
            </button>
            {picker ? (
              <div className="absolute right-0 top-11 z-50 max-h-72 w-72 overflow-auto rounded-2xl bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,.18)]">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSlug(p.slug);
                      setQty(p.moq);
                      setPicker(false);
                    }}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
                  >
                    <span className="font-medium">{skuLabel(p)}</span>
                    <span className="mt-0.5 block text-[11px] text-[#6b7280]">{p.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <p className="hidden text-[12px] text-[#6b7280] sm:block">{qty} st</p>
          <button type="button" onClick={resetDesign} className="hidden h-9 rounded-full border border-black/10 px-3 text-[12px] font-medium sm:inline-flex sm:items-center">
            Återställ
          </button>
          {isReseller ? (
            <button type="button" onClick={addToOrder} className="h-9 rounded-full border border-black/10 bg-white px-4 text-[13px] font-semibold">
              Lägg till i order
            </button>
          ) : (
            <button type="button" onClick={requestQuote} className="h-9 rounded-full border border-black/10 bg-white px-4 text-[13px] font-semibold">
              Begär offert
            </button>
          )}
          <button type="button" onClick={next} className="h-9 rounded-full bg-[#5B7FD4] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#4C6FC4]">
            Kassa
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[84px] shrink-0 flex-col items-center gap-1 border-r border-black/5 bg-white/70 py-4 md:flex">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTool(t.id);
                if (t.id === "preview") openRealityPane();
                else setView("etikett");
              }}
              className={`flex w-[68px] flex-col items-center gap-1 rounded-2xl py-3 text-[11px] font-medium ${
                tool === t.id ? "bg-[#E8EEFA] text-[#3B5BAA]" : "text-[#6b7280] hover:bg-black/[0.04]"
              }`}
            >
              <ToolIcon id={t.id} />
              {t.label}
            </button>
          ))}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-auto p-3 lg:flex-row lg:overflow-hidden">
          <section className="flex min-h-[420px] min-w-0 flex-1 flex-col rounded-[22px] bg-white shadow-[0_8px_30px_rgba(15,23,42,.04)]">
            <ol className="flex gap-1 overflow-x-auto px-4 pt-3 text-[11px] font-medium">
              {STEPS.map((s, i) => (
                <li key={s.id} className="flex items-center gap-1">
                  {i > 0 ? <span className="text-[#d4d4d8]">→</span> : null}
                  <button
                    type="button"
                    onClick={() => goStep(i)}
                    className={`rounded-full px-2.5 py-1 ${step === i ? "bg-[#E8EEFA] text-[#3B5BAA]" : "text-[#6b7280] hover:bg-black/[0.04]"}`}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
            <PaneToggle
              active={view}
              loading={realityLoading}
              onEtikett={() => {
                setView("etikett");
                if (tool === "preview") setTool("design");
              }}
              onAngles={() => {
                setView("vinklar");
                setTool("preview");
              }}
              onReality={openRealityPane}
            />
            <div className="relative min-h-0 flex-1">
              {view === "verklighet" ? (
                <RealityView
                  imageUrl={realityUrl}
                  loading={realityLoading}
                  error={realityError}
                  stale={Boolean(realityUrl && realityFp !== realityKey)}
                  onGenerate={() => void seeInReality()}
                  onBack={() => {
                    setView("etikett");
                    if (tool === "preview") setTool("design");
                  }}
                />
              ) : view === "vinklar" ? (
                <div className="absolute inset-0 px-4 pb-4 pt-2">
                  <BottlePreview
                    categorySlug={product.categorySlug}
                    productSlug={product.slug}
                    volumeMl={product.volumeMl}
                    cap={cap}
                    finish={finish}
                    water={water}
                    labelKind={label}
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

          <aside className="w-full shrink-0 overflow-y-auto rounded-[22px] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,.06)] lg:w-[280px]">
            <Inspector
              tool={tool}
              layers={layers}
              selected={selected}
              finish={finish}
              water={water}
              cap={cap}
              label={label}
              qty={qty}
              qtys={qtys}
              onSelect={setSelectedId}
              onFinish={setFinish}
              onWater={setWater}
              onCap={setCap}
              onLabel={setLabel}
              onQty={setQty}
              onLayerChange={(id, patch) => updateLayer(id, patch)}
              onCenter={() => updateLayer(selected.id, { x: 50, y: selected.type === "logo" ? 46 : 70, rotation: 0 })}
              onMatchColors={() => updateLayer("text", { color: "#005CAF" })}
              onOptimize={() =>
                pushHistory(
                  layers.map((l) =>
                    l.type === "logo"
                      ? { ...l, x: 50, y: 46, scale: 1, rotation: 0 }
                      : l.type === "text"
                        ? { ...l, x: 50, y: 70, scale: 1, rotation: 0 }
                        : { ...l, scale: 1, rotation: 0 },
                  ),
                )
              }
              onUpload={(src) => updateLayer(selected.type === "logo" ? "logo" : "artwork", { src })}
              onPrintFile={(name) => setPrintFiles((prev) => [...prev, name])}
              printFiles={printFiles}
              onOpenReality={openRealityPane}
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
              if (t.id === "preview") openRealityPane();
              else setView("etikett");
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${tool === t.id ? "bg-[#E8EEFA] text-[#3B5BAA]" : "text-[#6b7280]"}`}
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
  water,
  cap,
  label,
  qty,
  qtys,
  onSelect,
  onFinish,
  onWater,
  onCap,
  onLabel,
  onQty,
  onLayerChange,
  onCenter,
  onMatchColors,
  onOptimize,
  onUpload,
  onPrintFile,
  printFiles,
  onOpenReality,
  onReset,
}: {
  tool: Tool;
  layers: Layer[];
  selected: Layer;
  finish: Finish;
  water: string;
  cap: string;
  label: string;
  qty: number;
  qtys: number[];
  onSelect: (id: string) => void;
  onFinish: (f: Finish) => void;
  onWater: (v: string) => void;
  onCap: (v: string) => void;
  onLabel: (v: string) => void;
  onQty: (n: number) => void;
  onLayerChange: (id: string, patch: Partial<Layer>) => void;
  onCenter: () => void;
  onMatchColors: () => void;
  onOptimize: () => void;
  onUpload: (src: string) => void;
  onPrintFile: (name: string) => void;
  printFiles: string[];
  onOpenReality: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5 text-sm">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Lager</p>
        <ul className="mt-2 space-y-1">
          {[...layers].reverse().map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => onSelect(l.id)}
                className={`w-full rounded-xl px-3 py-2 text-left ${selected.id === l.id ? "bg-[#E8EEFA] text-[#3B5BAA]" : "hover:bg-black/[0.04]"}`}
              >
                {l.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {tool === "text" || selected.type === "text" ? (
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Text</span>
          <input
            value={layers.find((l) => l.type === "text")?.text ?? ""}
            onChange={(e) => {
              onSelect("text");
              onLayerChange("text", { text: e.target.value });
            }}
            className="mt-2 h-10 w-full rounded-xl border border-black/10 px-3"
            placeholder="Skriv på etiketten"
          />
        </label>
      ) : null}

      {selected.type === "qr" || tool === "upload" ? (
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">QR-länk</span>
          <input
            value={layers.find((l) => l.type === "qr")?.text ?? ""}
            onChange={(e) => {
              onSelect("qr");
              onLayerChange("qr", { text: e.target.value });
            }}
            className="mt-2 h-10 w-full rounded-xl border border-black/10 px-3"
            placeholder="https://"
          />
        </label>
      ) : null}

      {tool === "upload" ? (
        <label className="flex h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-black/15 text-center text-[13px] text-[#6b7280]">
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
          {selected.type === "logo"
            ? "Ladda upp logotyp (PNG, SVG, PDF eller AI)"
            : "Ladda upp bakgrund eller tryckfil (PNG, JPG, SVG, PDF, AI)"}
        </label>
      ) : null}
      {printFiles.length ? (
        <ul className="space-y-1 text-[12px] text-[#6b7280]">
          {printFiles.map((name) => (
            <li key={name}>Tryckfil: {name}</li>
          ))}
        </ul>
      ) : null}

      {tool === "colors" ? (
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Textfärg</span>
          <input
            type="color"
            value={layers.find((l) => l.type === "text")?.color ?? "#1d1d1f"}
            onChange={(e) => {
              onSelect("text");
              onLayerChange("text", { color: e.target.value });
            }}
            className="mt-2 h-10 w-full rounded-xl border border-black/10"
          />
        </label>
      ) : null}

      {tool === "bottle" ? (
        <div className="space-y-3">
          <Field label="Vatten">
            <select value={water} onChange={(e) => onWater(e.target.value)} className="h-10 w-full rounded-xl border border-black/10 px-3">
              <option value="stilla">Stilla</option>
              <option value="kolsyrat">Kolsyrat</option>
            </select>
          </Field>
          <Field label="Kapsyl">
            <select value={cap} onChange={(e) => onCap(e.target.value)} className="h-10 w-full rounded-xl border border-black/10 px-3">
              <option value="skruvkork">Skruvkork</option>
              <option value="sportkork">Sportkork</option>
            </select>
          </Field>
          <Field label="Etikett">
            <select value={label} onChange={(e) => onLabel(e.target.value)} className="h-10 w-full rounded-xl border border-black/10 px-3">
              <option value="papper">Papper</option>
              <option value="transparent">Transparent</option>
            </select>
          </Field>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Antal</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {qtys.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onQty(n)}
                  className={`rounded-full px-3 py-1.5 text-xs ${qty === n ? "bg-[#5B7FD4] text-white" : "bg-black/[0.04]"}`}
                >
                  {n} st
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Placering</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Num label="Position" value={Math.round(selected.x)} onChange={(v) => onLayerChange(selected.id, { x: v })} />
          <Num label="Skala" value={Number(selected.scale.toFixed(1))} step={0.1} onChange={(v) => onLayerChange(selected.id, { scale: v })} />
          <Num label="Vridning" value={selected.rotation} onChange={(v) => onLayerChange(selected.id, { rotation: v })} />
        </div>
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Tryck / material</p>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-[#F4F5F7] p-1">
          {(["matte", "gloss"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFinish(f)}
              className={`rounded-full py-1.5 text-xs font-medium ${finish === f ? "bg-white shadow-sm" : "text-[#6b7280]"}`}
            >
              {f === "matte" ? "Matt" : "Blank"}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">AI-hjälp</p>
        <div className="mt-2 space-y-1.5">
          <AiBtn onClick={onOpenReality}>Se i verkligheten</AiBtn>
          <AiBtn onClick={onCenter}>Centrera motiv</AiBtn>
          <AiBtn onClick={onMatchColors}>Matcha varumärkesfärger</AiBtn>
          <AiBtn onClick={onOptimize}>Optimera layout</AiBtn>
          <AiBtn onClick={onReset}>Återställ design</AiBtn>
          <Link href="/designa/ai" className="block rounded-xl px-3 py-2 text-[13px] text-[#3B5BAA] hover:bg-[#E8EEFA]">
            Öppna AI-studio →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="text-[10px] text-[#6b7280]">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-9 w-full rounded-lg border border-black/10 px-2 text-xs"
      />
    </label>
  );
}

function AiBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] hover:bg-black/[0.04]">
      {children}
      <span className="text-[#9ca3af]">✦</span>
    </button>
  );
}

function PaneToggle({
  active,
  loading,
  onEtikett,
  onAngles,
  onReality,
}: {
  active: "etikett" | "vinklar" | "verklighet";
  loading: boolean;
  onEtikett: () => void;
  onAngles: () => void;
  onReality: () => void;
}) {
  return (
    <div className="flex justify-center pt-4">
      <div className="inline-flex rounded-full bg-[#F4F5F7] p-1 text-[12px] font-medium">
        <button
          type="button"
          onClick={onEtikett}
          className={`rounded-full px-4 py-1.5 ${active === "etikett" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6b7280]"}`}
        >
          Etikett
        </button>
        <button
          type="button"
          onClick={onAngles}
          className={`rounded-full px-4 py-1.5 ${active === "vinklar" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6b7280]"}`}
        >
          3D / vinklar
        </button>
        <button
          type="button"
          onClick={onReality}
          className={`rounded-full px-4 py-1.5 ${active === "verklighet" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6b7280]"}`}
        >
          {loading ? "Skapar…" : "Se i verkligheten"}
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
        <path d="M10 4h4v3l2 3v10H8V10l2-3V4Z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
