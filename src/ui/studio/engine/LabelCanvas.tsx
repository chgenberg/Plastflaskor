"use client";

import { useEffect, useRef } from "react";
import { LabelLayers } from "./LabelLayers";
import type { Layer } from "./types";

function clamp(n: number, min = 4, max = 96) {
  return Math.min(max, Math.max(min, n));
}

export function LabelCanvas({
  layers,
  selectedId,
  zoom,
  onSelect,
  onMove,
  onDelete,
  onZoom,
}: {
  layers: Layer[];
  selectedId: string;
  zoom: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: () => void;
  onZoom: (next: number) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; x: number; y: number } | null>(null);
  const layersRef = useRef(layers);
  const onMoveRef = useRef(onMove);
  layersRef.current = layers;
  onMoveRef.current = onMove;

  function clientToPct(clientX: number, clientY: number) {
    const box = frame.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return { x: 50, y: 50 };
    return {
      x: ((clientX - box.left) / box.width) * 100,
      y: ((clientY - box.top) / box.height) * 100,
    };
  }

  function place(id: string, x: number, y: number) {
    const el = frame.current?.querySelector<HTMLElement>(`[data-layer-id="${id}"]`);
    if (!el) return;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
  }

  function startDrag(id: string, e: { clientX: number; clientY: number; pointerId: number }) {
    const layer = layersRef.current.find((l) => l.id === id);
    if (!layer || layer.type === "artwork") return;
    const { x, y } = clientToPct(e.clientX, e.clientY);
    drag.current = { id, dx: x - layer.x, dy: y - layer.y, x: layer.x, y: layer.y };
    frame.current?.setPointerCapture?.(e.pointerId);
  }

  useEffect(() => {
    function move(e: PointerEvent) {
      const active = drag.current;
      if (!active) return;
      e.preventDefault();
      const { x, y } = clientToPct(e.clientX, e.clientY);
      active.x = clamp(x - active.dx);
      active.y = clamp(y - active.dy);
      place(active.id, active.x, active.y);
    }

    function end() {
      const active = drag.current;
      if (!active) return;
      drag.current = null;
      onMoveRef.current(active.id, active.x, active.y);
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
      onMoveRef.current(layer.id, clamp(layer.x + delta[0]), clamp(layer.y + delta[1]));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={frame}
        className="relative mx-auto my-auto aspect-[16/9] w-full max-w-[560px] overflow-hidden rounded-xl bg-[#e5e7eb] shadow-[0_10px_40px_rgba(20,30,40,.08)] touch-none"
        style={{ transform: `scale(${zoom})` }}
      >
        <div className="absolute inset-0">
          <LabelLayers
            layers={layers}
            selectedId={selectedId}
            interactive
            onSelect={onSelect}
            onDragStart={startDrag}
          />
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] text-[#9ca3af]">Dra loggan eller texten. Piltangenter flyttar 1 %, Shift 4 %.</p>
      <div className="mt-auto flex items-center justify-between px-1 pt-3">
        <button type="button" onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b7280] hover:bg-black/[0.05]" aria-label="Ta bort lager">
          <TrashIcon />
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onZoom(Math.max(0.7, zoom - 0.1))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.05]" aria-label="Zooma ut">
            −
          </button>
          <button type="button" onClick={() => onZoom(Math.min(1.4, zoom + 0.1))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.05]" aria-label="Zooma in">
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
