export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function snap(n: number, targets: number[], threshold = 1.4) {
  for (const t of targets) {
    if (Math.abs(n - t) <= threshold) return t;
  }
  return n;
}

export function wrapInsets(wrap: { widthMm: number; heightMm: number; bleedMm: number }) {
  const bleedX = (wrap.bleedMm / wrap.widthMm) * 100;
  const bleedY = (wrap.bleedMm / wrap.heightMm) * 100;
  const safeX = ((wrap.bleedMm + 3) / wrap.widthMm) * 100;
  const safeY = ((wrap.bleedMm + 3) / wrap.heightMm) * 100;
  return { bleedX, bleedY, safeX, safeY };
}

export function bleedPct(wrap: { widthMm: number; bleedMm: number }) {
  return (wrap.bleedMm / wrap.widthMm) * 100;
}

export function safePct(wrap: { widthMm: number; bleedMm: number }) {
  return ((wrap.bleedMm + 3) / wrap.widthMm) * 100;
}

export function safeY(wrap: { heightMm: number; bleedMm: number }) {
  return ((wrap.bleedMm + 3) / wrap.heightMm) * 100;
}

export function keyboardDelta(key: string, shift: boolean): [number, number] | undefined {
  const step = shift ? 5 : 1;
  const map: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  return map[key];
}

export function scaleStep(scale: number, dir: 1 | -1) {
  return clamp(Number((scale + dir * 0.1).toFixed(2)), 0.3, 4);
}

export function hudOffset(
  box: { left: number; top: number; width: number; height: number },
  host: { left: number; top: number; width: number },
  zoom: number,
) {
  const z = zoom || 1;
  return {
    left: clamp((box.left - host.left + box.width / 2) / z, 48, host.width / z - 48),
    top: Math.max(8, (box.top - host.top) / z - 40),
  };
}
