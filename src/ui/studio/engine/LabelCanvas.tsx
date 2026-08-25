"use client";

import { useRef } from "react";
import { LabelLayers } from "./LabelLayers";
import type { Layer } from "./types";

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
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  function clientToPct(clientX: number, clientY: number) {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return { x: 50, y: 50 };
    return {
      x: ((clientX - box.left) / box.width) * 100,
      y: ((clientY - box.top) / box.height) * 100,
    };
  }

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={frame}
        className="relative mx-auto my-auto aspect-[16/9] w-full max-w-[560px] overflow-hidden rounded-xl bg-[#e7ebe6] shadow-[0_10px_40px_rgba(20,30,40,.08)]"
        style={{ transform: `scale(${zoom})` }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("[data-layer]") == null && e.currentTarget === e.target) {
            /* keep selection */
          }
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const { x, y } = clientToPct(e.clientX, e.clientY);
          onMove(drag.current.id, x - drag.current.dx, y - drag.current.dy);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
      >
        <div className="absolute inset-0">
          <LabelLayers
            layers={layers}
            selectedId={selectedId}
            interactive
            onSelect={onSelect}
            onDragStart={(id, e) => {
              const layer = layers.find((l) => l.id === id);
              if (!layer || layer.type === "artwork") return;
              const { x, y } = clientToPct(e.clientX, e.clientY);
              drag.current = { id, dx: x - layer.x, dy: y - layer.y };
              frame.current?.setPointerCapture?.(e.pointerId);
            }}
          />
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] text-[#9ca3af]">Platt tryckyta — så här ser etiketten ut innan den sätts på produkten</p>
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
