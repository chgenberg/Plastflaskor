"use client";

import { useEffect, useRef } from "react";
import { imageForProduct } from "@/domain/productImages";
import { previewKind } from "./preview3d/buildProduct";
import { composeLabelCanvas } from "./preview3d/labelTexture";
import type { Layer } from "./types";

/** Label box as a fraction of the product photo (object-contain). */
const FRAME: Record<string, { left: number; top: number; width: number; height: number; bend: number }> = {
  pet: { left: 0.33, top: 0.37, width: 0.34, height: 0.19, bend: 0.055 },
  can: { left: 0.36, top: 0.3, width: 0.28, height: 0.36, bend: 0.04 },
  cup: { left: 0.31, top: 0.3, width: 0.38, height: 0.36, bend: 0.07 },
  shiva: { left: 0.34, top: 0.34, width: 0.32, height: 0.26, bend: 0.05 },
  aqua: { left: 0.34, top: 0.36, width: 0.32, height: 0.27, bend: 0.05 },
  cooler: { left: 0.3, top: 0.4, width: 0.4, height: 0.26, bend: 0 },
};

function contain(cw: number, ch: number, iw: number, ih: number) {
  const scale = Math.min(cw / iw, ch / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}

/** Cylinder-warp used by 2D bottle mockups: vertical slices + ellipse (see SO / Photoshop Cylinder Warp). */
function wrapLabel(
  ctx: CanvasRenderingContext2D,
  label: HTMLCanvasElement,
  x0: number,
  y0: number,
  destW: number,
  destH: number,
  yaw: number,
  bend: number,
) {
  const iw = label.width;
  const ih = label.height;
  const visible = 0.52;
  const yawT = (((-yaw / 360) % 1) + 1) % 1;
  const steps = Math.max(80, Math.floor(destW));

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const nx = t * 2 - 1;
    const cos = Math.sqrt(Math.max(0, 1 - nx * nx));
    if (cos < 0.08) continue;
    const yOff = destH * bend * (1 - cos);
    const sliceH = destH - yOff * 2;
    const u = (t * visible + yawT * (1 - visible)) % 1;
    const sx = u * iw;
    const sw = Math.max(1, (iw * visible) / steps);
    ctx.globalAlpha = 0.5 + 0.5 * cos;
    ctx.drawImage(label, sx, 0, sw, ih, x0 + t * destW, y0 + yOff, destW / steps + 0.6, sliceH);
    const edge = 1 - cos;
    if (edge > 0.15) {
      ctx.fillStyle = `rgba(20,18,16,${0.22 * edge})`;
      ctx.fillRect(x0 + t * destW, y0 + yOff, destW / steps + 0.6, sliceH);
    }
  }
  ctx.globalAlpha = 1;
}

export function PhotoMockup({
  slug,
  categorySlug,
  yaw,
  zoom,
  layers,
}: {
  slug: string;
  categorySlug: string;
  yaw: number;
  zoom: number;
  layers: Layer[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const src = imageForProduct(slug);

  useEffect(() => {
    if (!src) return;
    const photo = src;
    let dead = false;

    async function paint() {
      const canvas = canvasRef.current;
      const box = host.current;
      if (!canvas || !box) return;

      const product = new window.Image();
      product.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        product.onload = () => resolve();
        product.onerror = () => reject();
        product.src = photo;
      });
      if (dead) return;
      const label = await composeLabelCanvas(layers);
      if (dead) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = box.clientWidth || 1;
      const ch = box.clientHeight || 1;
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      const pad = 28;
      const inner = { x: pad, y: pad, w: cw - pad * 2, h: ch - pad * 2 };
      const fit = contain(inner.w, inner.h, product.naturalWidth, product.naturalHeight);
      const z = zoom;
      const ox = inner.x + fit.x + fit.w / 2;
      const oy = inner.y + fit.y + fit.h / 2;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(z, z);
      ctx.translate(-fit.w / 2, -fit.h / 2);
      ctx.drawImage(product, 0, 0, fit.w, fit.h);

      const kind = previewKind(slug, categorySlug);
      const frame = FRAME[kind] ?? FRAME.pet;
      const lx = fit.w * frame.left;
      const ly = fit.h * frame.top;
      const lw = fit.w * frame.width;
      const lh = fit.h * frame.height;

      if (frame.bend <= 0) {
        ctx.drawImage(label, lx, ly, lw, lh);
      } else {
        wrapLabel(ctx, label, lx, ly, lw, lh, yaw, frame.bend);
      }
      ctx.restore();
    }

    void paint();
    const ro = new ResizeObserver(() => void paint());
    if (host.current) ro.observe(host.current);
    return () => {
      dead = true;
      ro.disconnect();
    };
  }, [src, slug, categorySlug, yaw, zoom, layers]);

  if (!src) return null;

  return (
    <div ref={host} className="h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
