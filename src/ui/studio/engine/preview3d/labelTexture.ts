import * as THREE from "three";

export { blankLabelCanvas, composeLabelCanvas } from "../flattenLabel";

export function labelMapFromCanvas(canvas: HTMLCanvasElement) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.needsUpdate = true;
  return map;
}

export function makeDropletNormal(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#8080ff";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1.2 + Math.random() * 5.5;
    const g = ctx.createRadialGradient(x - r * 0.28, y - r * 0.32, 0, x, y, r);
    g.addColorStop(0, "rgb(210,210,255)");
    g.addColorStop(0.45, "rgb(128,128,255)");
    g.addColorStop(1, "rgb(70,70,190)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r * (0.75 + Math.random() * 0.4), r, Math.random() * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

export function makeWoodGrain(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#e4d8c4";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    const n = 210 + Math.sin(y * 0.15) * 10 + Math.random() * 12;
    ctx.fillStyle = `rgb(${n},${n - 18},${n - 36})`;
    ctx.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(90,70,45,${0.04 + Math.random() * 0.06})`;
    ctx.beginPath();
    const x = Math.random() * size;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 8, size * 0.3, x - 6, size * 0.7, x + 4, size);
    ctx.stroke();
  }
  return canvas;
}

export function makePaperGrain(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 118 + Math.random() * 28;
    img.data[i] = n;
    img.data[i + 1] = n;
    img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
