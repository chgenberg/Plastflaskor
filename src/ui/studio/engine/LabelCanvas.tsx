"use client";

import { useEffect, useRef } from "react";
import { LabelLayers } from "./LabelLayers";
import type { Layer } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type Drag =
  | { kind: "move"; id: string; dx: number; dy: number; x: number; y: number }
  | { kind: "scale"; id: string; cx: number; cy: number; startDist: number; startScale: number; scale: number };

export function LabelCanvas({
  layers,
  selectedId,
  zoom,
  onSelect,
  onMove,
  onScale,
  onDelete,
  onZoom,
}: {
  layers: Layer[];
  selectedId: string;
  zoom: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onScale: (id: string, scale: number) => void;
  onDelete: () => void;
  onZoom: (next: number) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const layersRef = useRef(layers);
  const onMoveRef = useRef(onMove);
  const onScaleRef = useRef(onScale);
  layersRef.current = layers;
  onMoveRef.current = onMove;
  onScaleRef.current = onScale;

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

  function paint(id: string, next: { x?: number; y?: number; scale?: number }) {
    const el = layerEl(id);
    const layer = layersRef.current.find((l) => l.id === id);
    if (!el || !layer) return;
    const x = next.x ?? layer.x;
    const y = next.y ?? layer.y;
    const scale = next.scale ?? layer.scale;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${layer.rotation}deg)`;
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

  useEffect(() => {
    function move(e: PointerEvent) {
      const active = drag.current;
      if (!active) return;
      e.preventDefault();
      if (active.kind === "move") {
        const { x, y } = clientToPct(e.clientX, e.clientY);
        active.x = clamp(x - active.dx, 4, 96);
        active.y = clamp(y - active.dy, 4, 96);
        paint(active.id, { x: active.x, y: active.y });
        return;
      }
      const dist = Math.hypot(e.clientX - active.cx, e.clientY - active.cy) || 1;
      active.scale = clamp(active.startScale * (dist / active.startDist), 0.3, 4);
      paint(active.id, { scale: active.scale });
    }

    function end() {
      const active = drag.current;
      if (!active) return;
      drag.current = null;
      if (active.kind === "move") onMoveRef.current(active.id, active.x, active.y);
      else onScaleRef.current(active.id, Number(active.scale.toFixed(2)));
    }

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const layer = layersRef.current.find((l) => l.id === selectedId);
      if (!layer || layer.type === "artwork") return;
      if (e.key === "]" || e.key === "+") {
        e.preventDefault();
        onScaleRef.current(layer.id, clamp(layer.scale + 0.1, 0.3, 4));
        return;
      }
      if (e.key === "[" || e.key === "-") {
        e.preventDefault();
        onScaleRef.current(layer.id, clamp(layer.scale - 0.1, 0.3, 4));
        return;
      }
      const step = e.shiftKey ? 4 : 1;
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const delta = map[e.key];
      if (!delta) return;
      e.preventDefault();
      onMoveRef.current(layer.id, clamp(layer.x + delta[0], 4, 96), clamp(layer.y + delta[1], 4, 96));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={frame}
        className="relative mx-auto my-auto aspect-[16/9] w-full max-w-[560px] touch-none overflow-hidden rounded-[var(--av-radius-lg)] bg-[var(--av-gray-100)] shadow-[var(--av-shadow-sm)]"
        style={{ transform: `scale(${zoom})` }}
      >
        <div className="absolute inset-0">
          <LabelLayers layers={layers} selectedId={selectedId} interactive onSelect={onSelect} onDragStart={startMove} onScaleStart={startScale} />
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] text-[var(--av-text-muted)]">Dra för att flytta. Hörnen skalar. Piltangenter flyttar, [ ] ändrar storlek.</p>
      <div className="mt-auto flex items-center justify-between px-1 pt-3">
        <button type="button" onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-[var(--av-radius-md)] text-[var(--av-text-muted)] hover:bg-[var(--av-bg)]" aria-label="Ta bort lager">
          <TrashIcon />
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onZoom(Math.max(0.7, zoom - 0.1))} className="flex h-9 w-9 items-center justify-center rounded-[var(--av-radius-md)] hover:bg-[var(--av-bg)]" aria-label="Zooma ut">
            −
          </button>
          <button type="button" onClick={() => onZoom(Math.min(1.4, zoom + 0.1))} className="flex h-9 w-9 items-center justify-center rounded-[var(--av-radius-md)] hover:bg-[var(--av-bg)]" aria-label="Zooma in">
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
