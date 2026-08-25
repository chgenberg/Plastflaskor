"use client";

import { useEffect, useRef } from "react";
import { imageForProduct } from "@/domain/productImages";
import { PhotoMockup } from "./PhotoMockup";
import { previewKind } from "./preview3d/buildProduct";
import { mountProductScene, type SceneHandle } from "./preview3d/ProductScene";
import type { Finish, Layer } from "./types";

export function BottlePreview({
  categorySlug,
  productSlug,
  volumeMl,
  cap,
  finish,
  water = "stilla",
  labelKind = "papper",
  yaw,
  zoom,
  layers,
  onYaw,
}: {
  categorySlug: string;
  productSlug?: string;
  volumeMl?: number | null;
  cap: string;
  finish: Finish;
  water?: string;
  labelKind?: string;
  yaw: number;
  zoom: number;
  layers: Layer[];
  onYaw?: (yaw: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<SceneHandle | null>(null);
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const slug = productSlug ?? categorySlug;
  const photo = imageForProduct(slug);

  const cfg = {
    kind: previewKind(slug, categorySlug),
    slug,
    volumeMl,
    cap,
    finish,
    water,
    labelKind,
  };

  useEffect(() => {
    if (photo) return;
    const el = host.current;
    if (!el) return;
    try {
      const handle = mountProductScene(el, { cfg, layers, yaw, zoom });
      scene.current = handle;
      return () => {
        handle.dispose();
        scene.current = null;
      };
    } catch {
      el.innerHTML =
        '<p class="flex h-full items-center justify-center px-6 text-center text-sm text-[#6b7280]">3D-förhandsvisning kräver WebGL i webbläsaren.</p>';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  useEffect(() => {
    scene.current?.setView(yaw, zoom);
  }, [yaw, zoom]);

  useEffect(() => {
    scene.current?.setConfig(cfg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.kind, cfg.slug, cfg.volumeMl, cfg.cap, cfg.finish, cfg.water, cfg.labelKind]);

  useEffect(() => {
    scene.current?.setLayers(layers);
  }, [layers]);

  return (
    <div
      ref={host}
      className="relative h-full min-h-[320px] w-full cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, yaw };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current || !onYaw) return;
        onYaw(drag.current.yaw + (e.clientX - drag.current.x) * 0.35);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
    >
      {photo ? <PhotoMockup slug={slug} categorySlug={categorySlug} yaw={yaw} zoom={zoom} layers={layers} /> : null}
    </div>
  );
}
