import { qrSvgDataUrl } from "./qrMark";
import type { Layer } from "./types";

const cache = new Map<string, HTMLImageElement>();

function loadImage(src: string) {
  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) img.crossOrigin = "anonymous";
    img.onload = () => {
      cache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`image ${src}`));
    img.src = src;
  });
}

function fitImage(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number, mode: "cover" | "contain") {
  const iw = "width" in img ? Number(img.width) : w;
  const ih = "height" in img ? Number(img.height) : h;
  const scale = mode === "contain" ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

export function blankLabelCanvas(w = 1536, h = 768) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, w, h);
  }
  return canvas;
}

export async function composeLabelCanvas(layers: Layer[], w = 1536, h = 768) {
  const canvas = blankLabelCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const artwork = layers.find((l) => l.type === "artwork");
  if (artwork?.src) {
    try {
      const img = await loadImage(artwork.src);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((artwork.rotation * Math.PI) / 180);
      ctx.scale(artwork.flipX ? -artwork.scale : artwork.scale, artwork.scale);
      ctx.translate(-w / 2, -h / 2);
      if (artwork.fit === "contain") {
        const padX = w * 0.07;
        const padY = h * 0.07;
        ctx.translate(padX, padY);
        fitImage(ctx, img, w - padX * 2, h - padY * 2, "contain");
      } else {
        fitImage(ctx, img, w, h, "cover");
      }
      ctx.restore();
    } catch {
      /* keep paper base */
    }
  }

  const logo = layers.find((l) => l.type === "logo");
  if (logo?.src) {
    try {
      const img = await loadImage(logo.src);
      const lw = 300 * logo.scale;
      const lh = lw * (img.height / img.width);
      ctx.save();
      ctx.translate((logo.x / 100) * w, (logo.y / 100) * h);
      ctx.rotate((logo.rotation * Math.PI) / 180);
      ctx.scale(logo.flipX ? -1 : 1, 1);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      const padX = 14;
      const padY = 10;
      ctx.beginPath();
      ctx.roundRect(-lw / 2 - padX, -lh / 2 - padY, lw + padX * 2, lh + padY * 2, 8);
      ctx.fill();
      ctx.drawImage(img, -lw / 2, -lh / 2, lw, lh);
      ctx.restore();
    } catch {
      /* skip logo */
    }
  }

  const text = layers.find((l) => l.type === "text");
  if (text?.text) {
    ctx.save();
    ctx.translate((text.x / 100) * w, (text.y / 100) * h);
    ctx.rotate((text.rotation * Math.PI) / 180);
    ctx.scale(text.flipX ? -text.scale : text.scale, text.scale);
    ctx.fillStyle = text.color ?? "#1d1d1f";
    ctx.font = "600 48px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = text.align ?? "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,255,255,0.35)";
    ctx.shadowBlur = 4;
    ctx.fillText(text.text, 0, 0);
    ctx.restore();
  }

  const qr = layers.find((l) => l.type === "qr" && l.text);
  if (qr?.text) {
    try {
      const img = await loadImage(qrSvgDataUrl(qr.text, 256));
      const qw = 160 * qr.scale;
      ctx.save();
      ctx.translate((qr.x / 100) * w, (qr.y / 100) * h);
      ctx.rotate((qr.rotation * Math.PI) / 180);
      ctx.drawImage(img, -qw / 2, -qw / 2, qw, qw);
      ctx.restore();
    } catch {
      /* skip qr */
    }
  }

  return canvas;
}

export async function flattenLabelBlob(layers: Layer[]) {
  const canvas = await composeLabelCanvas(layers);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Kunde inte läsa wrapen.");
  return blob;
}

export async function composeLocalLabel(background?: string, logo?: string) {
  const canvas = await composeLabelCanvas([
    { id: "artwork", type: "artwork", name: "Bakgrund", x: 50, y: 50, scale: 1, rotation: 0, src: background },
    { id: "logo", type: "logo", name: "Logotyp", x: 50, y: 46, scale: 1, rotation: 0, src: logo },
    { id: "text", type: "text", name: "Text", x: 50, y: 70, scale: 1, rotation: 0, text: "" },
  ]);
  return canvas.toDataURL("image/png");
}
