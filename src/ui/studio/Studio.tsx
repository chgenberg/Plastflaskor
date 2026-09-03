"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDesignAction } from "@/actions";
import { assertRequiredPrintPlaced, emptyCupDocument, parseCupDocument, printGate, REQUIRED_PRINT_MESSAGE } from "@/domain/cupDocument";
import { BottlePreview } from "./engine/BottlePreview";
import { LabelCanvas } from "./engine/LabelCanvas";
import {
  defaultLayers,
  parseStudioCanvas,
  skuLabel,
  wrapForVolume,
  type Finish,
  type Layer,
  type StudioDraft,
  type StudioPane,
  type StudioProduct,
} from "./engine/types";
import { SelectionHud } from "./SelectionHud";
import { StudioInspector } from "./StudioInspector";
import { StudioStart } from "./StudioStart";

const PANES: { id: StudioPane; label: string }[] = [
  { id: "add", label: "Lägg till" },
  { id: "layers", label: "Lager" },
  { id: "bottle", label: "Flaska" },
  { id: "reqs", label: "Krav" },
];

function readRaster(file: File, onSrc: (src: string) => void, onPrint: (name: string) => void) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || ext === "ai") {
    onPrint(file.name);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onSrc(String(reader.result));
  reader.readAsDataURL(file);
}

export function Studio({
  products,
  initialSlug,
  role,
  latestDraft,
}: {
  products: StudioProduct[];
  initialSlug?: string;
  role?: string | null;
  latestDraft?: StudioDraft | null;
}) {
  const isBuyer = role === "CUSTOMER";
  const router = useRouter();
  const preferred = products.find((p) => p.slug === initialSlug) ?? products.find((p) => p.slug.includes("33cl")) ?? products[0];
  const [slug, setSlug] = useState(preferred?.slug);
  const product = products.find((p) => p.slug === slug) ?? products[0];
  const qty = product?.moq ?? 270;
  const [finish, setFinish] = useState<Finish>("matte");
  const [waterType, setWaterType] = useState<"stilla" | "kolsyrat">("stilla");
  const [cap, setCap] = useState<"skruvkork" | "sportkork" | "black" | "white">("skruvkork");
  const [placedReqs, setPlacedReqs] = useState<Record<string, boolean>>({});
  const [project, setProject] = useState("AQUA VISIBILITY / SS26");
  const [pane, setPane] = useState<StudioPane>("add");
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [selectedId, setSelectedId] = useState("artwork");
  const [zoom2d, setZoom2d] = useState(1);
  const [saved, setSaved] = useState(true);
  const [picker, setPicker] = useState(false);
  const [peekOpen, setPeekOpen] = useState(false);
  const [yaw, setYaw] = useState(18);
  const [printFiles, setPrintFiles] = useState<string[]>([]);
  const [gateError, setGateError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"start" | "edit">(initialSlug ? "edit" : "start");
  const [folded, setFolded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lockDieline, setLockDieline] = useState(false);
  const [designId, setDesignId] = useState<string | undefined>();
  const pickerRef = useRef<HTMLDivElement>(null);
  const history = useRef<Layer[][]>([defaultLayers()]);
  const future = useRef<Layer[][]>([]);
  const skipAutosave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const gate = printGate(requirements);
  const cupDoc = useMemo(
    () =>
      emptyCupDocument({
        productSlug: product.slug,
        variantSku: product.variants?.find((v) => v.water === waterType)?.sku ?? product.variantSku,
        quantity: qty,
        finish: finish === "gloss" ? "glossy" : "matte",
        wrap,
        layers: layers as unknown as Record<string, unknown>[],
        requirements,
      }),
    [product.slug, product.variantSku, product.variants, qty, finish, waterType, wrap, layers, requirements],
  );
  const options = useMemo(() => JSON.stringify({ ...cupDoc.options, waterType, cap }), [cupDoc, waterType, cap]);
  const emptyCanvas = !layers.some((l) => l.src || (l.type !== "artwork" && l.text));

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

  function applyDraft(draft: StudioDraft) {
    const canvas = parseStudioCanvas(draft.canvasJson);
    try {
      const opts = JSON.parse(draft.optionsJson) as { waterType?: "stilla" | "kolsyrat"; cap?: typeof cap };
      if (opts.waterType) setWaterType(opts.waterType);
      if (opts.cap) setCap(opts.cap);
    } catch {
      /* keep defaults */
    }
    const doc = parseCupDocument(draft.cupDocumentJson);
    if (doc) {
      setPlacedReqs(Object.fromEntries(doc.requirements.map((r) => [r.code, r.placed])));
    }
    const match = products.find((p) => p.id === draft.productId);
    if (match) setSlug(match.slug);
    if (canvas.finish) setFinish(canvas.finish);
    setPrintFiles(canvas.printFiles);
    history.current = [canvas.layers];
    future.current = [];
    setLayers(canvas.layers);
    setLockDieline(Boolean(canvas.layers.find((l) => l.type === "artwork" && l.src)));
    setProject(draft.projectName);
    setDesignId(draft.id);
    setPhase("edit");
    setPane("add");
  }

  function openPane(next: StudioPane) {
    setPane(next);
    setFolded(false);
    setSheetOpen(true);
  }

  function applyFile(file: File, target: "logo" | "artwork") {
    readRaster(
      file,
      (src) => {
        const patch = target === "artwork" ? { src, fit: "cover" as const } : { src };
        setLayers((curr) => {
          history.current = [...history.current, curr].slice(-30);
          future.current = [];
          return curr.map((l) => (l.id === target ? { ...l, ...patch } : l));
        });
        setSelectedId(target);
        setSaved(false);
      },
      (name) => setPrintFiles((prev) => [...prev, name]),
    );
  }

  function startFromLabel(file: File) {
    applyFile(file, "artwork");
    setLockDieline(true);
    setPhase("edit");
    openPane("reqs");
  }

  function deleteSelected() {
    if (selected.type === "artwork") {
      updateLayer("artwork", { src: undefined, fit: "cover" });
      setLockDieline(false);
      return;
    }
    if (selected.type === "logo") {
      updateLayer("logo", { src: undefined, x: 50, y: 46, scale: 1, rotation: 0, flipX: false });
      return;
    }
    updateLayer(selected.id, { text: "" });
  }

  function moveStack(id: string, dir: 1 | -1) {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx <= 0) return;
    const next = [...layers];
    const swap = idx + dir;
    if (swap <= 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    pushHistory(next);
  }

  useEffect(() => {
    if (!initialSlug) return;
    setSheetOpen(true);
    if (latestDraft && latestDraft.productId === product.id) applyDraft(latestDraft);
    // Mount-only: hydrate matching draft and open the mobile sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function writeDraft() {
    return saveDesignAction({
      productId: product.id,
      projectName: project,
      quantity: qty,
      optionsJson: options,
      canvasJson: JSON.stringify({ layers, finish, printFiles, wrap: cupDoc.wrap }),
      cupDocumentJson: JSON.stringify(cupDoc),
      designId,
    });
  }

  useEffect(() => {
    if (phase !== "edit") {
      skipAutosave.current = true;
      return;
    }
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      start(async () => {
        try {
          const design = await writeDraft();
          setDesignId(design.id);
          setSaved(true);
        } catch {
          setSaved(false);
        }
      });
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // writeDraft closes over the latest render; the deps are the document fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, finish, placedReqs, project, waterType, cap, slug, printFiles, phase]);

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
    return writeDraft();
  }

  function addToOrder() {
    start(async () => {
      try {
        const design = await persistDesign();
        setDesignId(design.id);
        router.push(`/konto/ordrar/ny?design=${design.id}`);
      } catch (err) {
        setGateError(err instanceof Error ? err.message : REQUIRED_PRINT_MESSAGE);
        openPane("reqs");
      }
    });
  }

  const inspector = (
    <StudioInspector
      pane={pane}
      layers={layers}
      selected={selected}
      finish={finish}
      product={product}
      waterType={waterType}
      cap={cap}
      placedReqs={placedReqs}
      wrap={wrap}
      printFiles={printFiles}
      onWaterType={setWaterType}
      onCap={setCap}
      onToggleReq={(code, placed) => {
        setPlacedReqs((prev) => ({ ...prev, [code]: placed }));
        setGateError(null);
      }}
      onSelect={setSelectedId}
      onFinish={setFinish}
      onLayerChange={(id, patch) => updateLayer(id, patch)}
      onUpload={(src, target) => {
        updateLayer(target, target === "artwork" ? { src, fit: "cover" } : { src });
        setSelectedId(target);
      }}
      onPrintFile={(name) => setPrintFiles((prev) => [...prev, name])}
    />
  );

  return (
    <div className="av-studio">
      <header className="av-studio-header">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center">
            <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={96} height={30} className="h-7 w-auto" />
          </Link>
          {phase === "edit" ? (
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="hidden max-w-[200px] truncate bg-transparent av-label outline-none md:block"
            />
          ) : null}
        </div>
        {phase === "edit" ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--av-text-muted)]">
              <span className={`h-1.5 w-1.5 rounded-full ${saved ? "bg-emerald-500" : "bg-amber-400"}`} />
              {saved ? "Sparad" : "Sparar"}
            </span>
            <button type="button" onClick={undo} className="flex h-8 w-8 items-center justify-center rounded-[var(--av-radius-md)] hover:bg-[var(--av-bg)]" aria-label="Ångra">
              ↩
            </button>
            <button type="button" onClick={redo} className="flex h-8 w-8 items-center justify-center rounded-[var(--av-radius-md)] hover:bg-[var(--av-bg)]" aria-label="Gör om">
              ↪
            </button>
          </div>
        ) : (
          <span />
        )}
        <div className="av-studio-header-end">
          {phase === "edit" ? (
            <div className="relative" ref={pickerRef}>
              <button type="button" onClick={() => setPicker((v) => !v)} className="h-8 rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] bg-white px-3 text-[12px] font-medium">
                {skuLabel(product)}
              </button>
              {picker ? (
                <div className="av-card absolute right-0 top-10 z-50 max-h-72 w-72 overflow-auto p-2">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSlug(p.slug);
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
          ) : null}
          {phase === "edit" && gate.total > 0 ? (
            <p className="av-studio-gate">
              <button type="button" onClick={() => openPane("reqs")}>
                {gate.done} av {gate.total} klara
              </button>
            </p>
          ) : null}
          {phase === "edit" && isBuyer ? (
            <button
              type="button"
              onClick={addToOrder}
              disabled={!gate.ready}
              className="h-8 rounded-[var(--av-radius-md)] bg-[var(--av-accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--av-accent-hover)] disabled:opacity-40"
            >
              Spara och beställ
            </button>
          ) : null}
          {phase === "edit" && !isBuyer ? (
            <Link href="/operations" className="inline-flex h-8 items-center rounded-[var(--av-radius-md)] bg-[var(--av-accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--av-accent-hover)]">
              Tillbaka till drift
            </Link>
          ) : null}
        </div>
      </header>
      {gateError ? <p className="shrink-0 border-b border-red-100 bg-red-50 px-5 py-2 text-center text-[13px] text-red-700">{gateError}</p> : null}

      {phase === "start" ? (
        <StudioStart
          draft={latestDraft ?? null}
          onDropLabel={startFromLabel}
          onLogo={() => {
            setPhase("edit");
            openPane("add");
            setSelectedId("logo");
          }}
          onContinue={() => {
            if (latestDraft) applyDraft(latestDraft);
          }}
        />
      ) : (
        <>
          <div className="av-studio-body">
            <aside className="av-studio-rail">
              {PANES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={pane === item.id && !folded ? "is-on" : undefined}
                  aria-label={item.label}
                  onClick={() => openPane(item.id)}
                >
                  <PaneIcon id={item.id} />
                </button>
              ))}
            </aside>

            <section className="av-studio-stage">
              <div className="av-studio-canvas-wrap px-4 pb-4 pt-3">
                <LabelCanvas
                  layers={layers}
                  selectedId={selectedId}
                  zoom={zoom2d}
                  wrap={wrap}
                  empty={emptyCanvas}
                  hideEmpty={lockDieline}
                  hud={
                    emptyCanvas ? undefined : (
                    <SelectionHud
                      layer={selected}
                      onCenter={() => updateLayer(selected.id, { x: 50, y: selected.type === "logo" ? 46 : 70, rotation: 0 })}
                      onFlip={() => updateLayer(selected.id, { flipX: !selected.flipX })}
                      onForward={() => moveStack(selected.id, 1)}
                      onBack={() => moveStack(selected.id, -1)}
                      onDelete={deleteSelected}
                      onScale={(scale) => updateLayer(selected.id, { scale })}
                      onColor={(color) => updateLayer(selected.id, { color })}
                      onAlign={(align) =>
                        updateLayer(selected.id, {
                          align,
                          x: align === "left" ? 22 : align === "right" ? 78 : 50,
                        })
                      }
                      onQr={(text) => updateLayer("qr", { text })}
                      onFit={(fit) => updateLayer("artwork", { fit })}
                    />
                    )
                  }
                  onSelect={setSelectedId}
                  onMove={(id, x, y) => updateLayer(id, { x, y })}
                  onScale={(id, scale) => updateLayer(id, { scale })}
                  onRotate={(id, rotation) => updateLayer(id, { rotation })}
                  onDelete={deleteSelected}
                  onZoom={setZoom2d}
                  onDropFile={(file) => applyFile(file, selected.type === "artwork" ? "artwork" : "logo")}
                />
              </div>

              <div className={`av-studio-peek ${peekOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 z-10 h-7 rounded-[var(--av-radius-md)] bg-[var(--av-surface)] px-2 text-[11px] font-medium text-[var(--av-text)]"
                  onClick={() => setPeekOpen((v) => !v)}
                >
                  {peekOpen ? "Stäng" : "Öppna flaska"}
                </button>
                <BottlePreview
                  categorySlug={product.categorySlug}
                  productSlug={product.slug}
                  volumeMl={product.volumeMl}
                  cap={cap}
                  finish={finish}
                  water={waterType}
                  yaw={yaw}
                  zoom={peekOpen ? 1 : 0.72}
                  layers={layers}
                  onYaw={setYaw}
                  compact={!peekOpen}
                />
              </div>

              <button type="button" className="av-studio-fold" aria-label={folded ? "Visa panel" : "Dölj panel"} onClick={() => setFolded((v) => !v)}>
                {folded ? "‹" : "›"}
              </button>
            </section>

            <aside className="av-studio-inspector" hidden={folded}>
              {inspector}
            </aside>

            {sheetOpen ? (
              <div className="av-studio-sheet">
                <button type="button" className="av-studio-sheet-close" onClick={() => setSheetOpen(false)}>
                  Stäng
                </button>
                {inspector}
              </div>
            ) : null}
          </div>

          <div className="av-studio-tabs">
            {PANES.map((item) => (
              <button key={item.id} type="button" className={pane === item.id && sheetOpen ? "is-on" : undefined} onClick={() => openPane(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PaneIcon({ id }: { id: StudioPane }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" as const };
  if (id === "add")
    return (
      <svg {...common}>
        <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  if (id === "layers")
    return (
      <svg {...common}>
        <path d="M4 15l8 4 8-4M4 11l8 4 8-4M4 7l8 4 8-4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  if (id === "bottle")
    return (
      <svg {...common}>
        <path d="M8 8h8l-1 12H9L8 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9.5 8V6.5h5V8" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
