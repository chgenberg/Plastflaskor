import Image from "next/image";
import type { PointerEvent } from "react";
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
  onDragStart?: (id: string, e: PointerEvent) => void;
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
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            onPointerDown={(e) => {
              if (!interactive) return;
              e.stopPropagation();
              onSelect?.(layer.id);
              onDragStart?.(layer.id, e);
            }}
            className={`absolute ${interactive ? "cursor-move" : ""}`}
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
            }}
          >
            {layer.type === "logo" && layer.src ? (
              <div className="rounded-md bg-white/90 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
                {layer.src.startsWith("data:") || layer.src.startsWith("blob:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={layer.src} alt="" className={compact ? "h-7 w-auto" : "h-10 w-auto"} />
                ) : (
                  <Image src={layer.src} alt="" width={compact ? 86 : 128} height={compact ? 28 : 42} />
                )}
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
