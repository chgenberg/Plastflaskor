"use client";

import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { clamp, hudOffset, keyboardDelta, scaleStep, snap, wrapInsets } from "./geometry";
import { LabelLayers } from "./LabelLayers";
import type { Layer } from "./types";

type Drag =
  | { kind: "move"; id: string; dx: number; dy: number; x: number; y: number }
  | { kind: "scale"; id: string; cx: number; cy: number; startDist: number; startScale: number; scale: number }
  | { kind: "rotate"; id: string; cx: number; cy: number; startAngle: number; startRot: number; rotation: number };

export function LabelCanvas({
  layers,
  selectedId,
  zoom,
  wrap,
  hud,
  empty,
  hideEmpty,
  onSelect,
  onMove,
  onScale,
  onRotate,
  onDelete,
  onZoom,
  onDropFile,
}: {
  layers: Layer[];
  selectedId: string;
  zoom: number;
  wrap: { widthMm: number; heightMm: number; bleedMm: number };
  hud?: ReactNode;
  empty?: boolean;
  hideEmpty?: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onScale: (id: string, scale: number) => void;
  onRotate: (id: string, rotation: number) => void;
  onDelete: () => void;
  onZoom: (next: number) => void;
  onDropFile?: (file: File) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const layersRef = useRef(layers);
  const onMoveRef = useRef(onMove);
  const onScaleRef = useRef(onScale);
  const onRotateRef = useRef(onRotate);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});
  const [hudPos, setHudPos] = useState<{ left: number; top: number } | null>(null);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  layersRef.current = layers;
  onMoveRef.current = onMove;
  onScaleRef.current = onScale;
  onRotateRef.current = onRotate;

  const { bleedX, bleedY, safeX, safeY } = wrapInsets(wrap);

  function clientToPct(clientX: number, clientY: number) {
    const box = frame.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return { x: 50, y: 50 };
    return {
      x: ((clientX - box.left) / box.width) * 100,
      y: ((clientY - box.top) / box.height) * 100,
    };
  }

  function layerEl(id: string) {
    return frame.current?.querySelector<HTMLElement>(`[data-layer-id="${id}"]`);
  }

  function paint(id: string, next: { x?: number; y?: number; scale?: number; rotation?: number }) {
    const el = layerEl(id);
    const layer = layersRef.current.find((l) => l.id === id);
    if (!el || !layer) return;
    const x = next.x ?? layer.x;
    const y = next.y ?? layer.y;
    const scale = next.scale ?? layer.scale;
    const rotation = next.rotation ?? layer.rotation;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.transform = `translate(-50%, -50%) scale(${layer.flipX ? -scale : scale}, ${scale}) rotate(${rotation}deg)`;
  }

  function startMove(id: string, e: { clientX: number; clientY: number }) {
    const layer = layersRef.current.find((l) => l.id === id);
    if (!layer || layer.type === "artwork") return;
    const { x, y } = clientToPct(e.clientX, e.clientY);
    drag.current = { kind: "move", id, dx: x - layer.x, dy: y - layer.y, x: layer.x, y: layer.y };
  }

  function startScale(id: string, e: { clientX: number; clientY: number }) {
    const layer = layersRef.current.find((l) => l.id === id);
    const el = layerEl(id);
    if (!layer || !el) return;
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    drag.current = { kind: "scale", id, cx, cy, startDist, startScale: layer.scale, scale: layer.scale };
  }

  function startRotate(id: string, e: { clientX: number; clientY: number }) {
    const layer = layersRef.current.find((l) => l.id === id);
    const el = layerEl(id);
    if (!layer || !el) return;
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    drag.current = {
      kind: "rotate",
      id,
      cx,
      cy,
      startAngle: (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI,
      startRot: layer.rotation,
      rotation: layer.rotation,
    };
  }

  useEffect(() => {
    function move(e: PointerEvent) {
      const active = drag.current;
      if (!active) return;
      e.preventDefault();
      if (active.kind === "move") {
        const { x, y } = clientToPct(e.clientX, e.clientY);
        let nx = clamp(x - active.dx, bleedX, 100 - bleedX);
        let ny = clamp(y - active.dy, bleedY, 100 - bleedY);
        const sx = snap(nx, [50, safeX, 100 - safeX]);
        const sy = snap(ny, [50, safeY, 100 - safeY]);
        setGuides({ x: sx === 50 || sx === safeX || sx === 100 - safeX ? sx : undefined, y: sy === 50 ? 50 : undefined });
        nx = sx;
        ny = sy;
        active.x = nx;
        active.y = ny;
        paint(active.id, { x: nx, y: ny });
        return;
      }
      if (active.kind === "scale") {
        const dist = Math.hypot(e.clientX - active.cx, e.clientY - active.cy) || 1;
        active.scale = clamp(active.startScale * (dist / active.startDist), 0.3, 4);
        paint(active.id, { scale: active.scale });
        return;
      }
      const angle = (Math.atan2(e.clientY - active.cy, e.clientX - active.cx) * 180) / Math.PI;
      active.rotation = Math.round(active.startRot + angle - active.startAngle);
      paint(active.id, { rotation: active.rotation });
    }

    function end() {
      const active = drag.current;
      if (!active) return;
      drag.current = null;
      setGuides({});
      if (active.kind === "move") onMoveRef.current(active.id, active.x, active.y);
      else if (active.kind === "scale") onScaleRef.current(active.id, Number(active.scale.toFixed(2)));
      else onRotateRef.current(active.id, active.rotation);
    }

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [bleedX, bleedY, safeX, safeY]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const layer = layersRef.current.find((l) => l.id === selectedId);
      if (!layer || layer.type === "artwork") return;
      if (e.key === "]" || e.key === "+") {
        e.preventDefault();
        onScaleRef.current(layer.id, scaleStep(layer.scale, 1));
        return;
      }
      if (e.key === "[" || e.key === "-") {
        e.preventDefault();
        onScaleRef.current(layer.id, scaleStep(layer.scale, -1));
        return;
      }
      const delta = keyboardDelta(e.key, e.shiftKey);
      if (!delta) return;
      e.preventDefault();
      onMoveRef.current(layer.id, clamp(layer.x + delta[0], bleedX, 100 - bleedX), clamp(layer.y + delta[1], bleedY, 100 - bleedY));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, bleedX, bleedY]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    function placeHud() {
      const host = frame.current;
      const node = selectedId === "artwork" ? host : layerEl(selectedId);
      if (!host || !node) {
        setHudPos(null);
        return;
      }
      const a = host.getBoundingClientRect();
      const b = node.getBoundingClientRect();
      setHudPos(hudOffset(b, a, zoom));
    }
    placeHud();
    const ro = new ResizeObserver(placeHud);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedId, layers, zoom]);

  useEffect(() => {
    const host = frame.current;
    if (!host) return;
    const canvas: HTMLDivElement = host;
    function onWheelNative(e: globalThis.WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const box = canvas.getBoundingClientRect();
      if (box.width && box.height) {
        setOrigin({
          x: ((e.clientX - box.left) / box.width) * 100,
          y: ((e.clientY - box.top) / box.height) * 100,
        });
      }
      const dir = e.deltaY > 0 ? -0.08 : 0.08;
      onZoom(clamp(Number((zoom + dir).toFixed(2)), 0.5, 2.2));
    }
    canvas.addEventListener("wheel", onWheelNative, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheelNative);
  }, [zoom, onZoom]);

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    pinch.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom };
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length !== 2 || !pinch.current) return;
    e.preventDefault();
    const [a, b] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    onZoom(clamp(pinch.current.zoom * (dist / (pinch.current.dist || 1)), 0.5, 2.2));
  }

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={frame}
        className="relative mx-auto my-auto w-full max-w-[720px] touch-none overflow-hidden bg-[var(--av-gray-100)]"
        style={{
          aspectRatio: `${wrap.widthMm} / ${wrap.heightMm}`,
          transform: `scale(${zoom})`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) onDropFile?.(file);
        }}
        onPointerDown={() => onSelect("artwork")}
      >
        <div className="absolute inset-0">
          <LabelLayers
            layers={layers}
            selectedId={selectedId}
            interactive
            onSelect={onSelect}
            onDragStart={startMove}
            onScaleStart={startScale}
            onRotateStart={startRotate}
            hideEmpty={hideEmpty}
          />
        </div>
        <div className="av-dieline-bleed" />
        <div className="av-dieline-trim" style={{ inset: `${bleedY}% ${bleedX}%` }} />
        <div className="av-dieline-safe" style={{ inset: `${safeY}% ${safeX}%` }} />
        {guides.x != null ? <span className="av-snap-x" style={{ left: `${guides.x}%` }} /> : null}
        {guides.y != null ? <span className="av-snap-y" style={{ top: `${guides.y}%` }} /> : null}
        {empty ? <p className="av-studio-empty">Släpp er logotyp här.</p> : null}
        {hud && hudPos ? (
          <div className="av-studio-hud" style={{ left: hudPos.left, top: hudPos.top, transform: "translateX(-50%)" }} role="toolbar" aria-label="Lager">
            {hud}
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between px-1 pt-3">
        <button type="button" onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-[var(--av-radius-md)] text-[var(--av-text-muted)] hover:bg-[var(--av-surface)]" aria-label="Ta bort lager">
          <TrashIcon />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setOrigin({ x: 50, y: 50 });
              onZoom(1);
            }}
            className="h-9 rounded-[var(--av-radius-md)] px-2 text-[12px] text-[var(--av-text-muted)] hover:bg-[var(--av-surface)]"
          >
            Anpassa
          </button>
          <button type="button" onClick={() => onZoom(Math.max(0.5, zoom - 0.1))} className="flex h-9 w-9 items-center justify-center rounded-[var(--av-radius-md)] hover:bg-[var(--av-surface)]" aria-label="Zooma ut">
            −
          </button>
          <button type="button" onClick={() => onZoom(Math.min(2.2, zoom + 0.1))} className="flex h-9 w-9 items-center justify-center rounded-[var(--av-radius-md)] hover:bg-[var(--av-surface)]" aria-label="Zooma in">
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 7h14M9 7V5h6v2M8 7l.8 12h6.4L16 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
