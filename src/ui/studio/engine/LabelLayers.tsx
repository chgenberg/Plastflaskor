import Image from "next/image";
import type { Layer } from "./types";

export function LabelLayers({
  layers,
  selectedId,
  interactive,
  onSelect,
  onDragStart,
  compact,
}: {
  layers: Layer[];
  selectedId?: string;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onDragStart?: (id: string, e: { clientX: number; clientY: number; pointerId: number }) => void;
  compact?: boolean;
}) {
  const artwork = layers.find((l) => l.type === "artwork");
  const rest = layers.filter((l) => l.type !== "artwork");

  return (
    <>
      {artwork?.src ? (
        <div
          className={`absolute inset-0 overflow-hidden ${interactive ? "cursor-default" : ""}`}
          onPointerDown={() => interactive && onSelect?.(artwork.id)}
        >
          {artwork.src.startsWith("data:") || artwork.src.startsWith("blob:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artwork.src}
              alt=""
              className="h-full w-full object-cover"
              style={{ transform: `scale(${artwork.scale}) rotate(${artwork.rotation}deg)` }}
            />
          ) : (
            <Image
              src={artwork.src}
              alt=""
              fill
              className="object-cover"
              sizes="640px"
              style={{ transform: `scale(${artwork.scale}) rotate(${artwork.rotation}deg)` }}
            />
          )}
          {interactive && selectedId === artwork.id ? (
            <span className="pointer-events-none absolute inset-1 rounded border border-dashed border-[#4C7AD9]" />
          ) : null}
        </div>
      ) : (
        <div className="absolute inset-0 bg-[#e5e7eb]" />
      )}
      {rest.map((layer) => {
        const selected = layer.id === selectedId;
        return (
          <div
            key={layer.id}
            data-layer-id={layer.id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            onPointerDown={(e) => {
              if (!interactive) return;
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(layer.id);
              onDragStart?.(layer.id, e);
            }}
            className={`absolute ${interactive ? "cursor-grab active:cursor-grabbing touch-none select-none" : ""}`}
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
            }}
          >
            {layer.type === "logo" && layer.src ? (
              <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={layer.src}
                  alt=""
                  draggable={false}
                  className={compact ? "h-8 w-auto max-w-[140px] object-contain" : "h-16 w-auto max-w-[240px] object-contain"}
                />
              </div>
            ) : null}
            {layer.type === "logo" && !layer.src && interactive ? (
              <div className="rounded-md border border-dashed border-[#1d1d1f]/25 bg-white/70 px-5 py-3 text-[11px] text-[#9ca3af]">
                Logotyp
              </div>
            ) : null}
            {layer.type === "text" && layer.text ? (
              <p
                className="whitespace-nowrap text-center font-semibold tracking-wide drop-shadow-sm"
                style={{ color: layer.color, fontSize: compact ? 9 : 15 }}
              >
                {layer.text}
              </p>
            ) : null}
            {interactive && selected ? (
              <span className="pointer-events-none absolute inset-[-8px] rounded border border-dashed border-[#4C7AD9]" />
            ) : null}
          </div>
        );
      })}
    </>
  );
}
