/** Visual QR-like mark from a URL. Finder patterns stay fixed so it reads as a code on the label. */
export function qrModules(data: string, size = 21) {
  const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  function finder(ox: number, oy: number) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        cells[oy + y][ox + x] = edge || inner;
      }
    }
  }
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  let h = 2166136261;
  for (let i = 0; i < data.length; i++) h = Math.imul(h ^ data.charCodeAt(i), 16777619);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const reserved =
        (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
      if (reserved) continue;
      h = Math.imul(h ^ (x + 31), 16777619) ^ Math.imul(y + 17, 97);
      cells[y][x] = (h >>> 8) % 3 !== 0;
    }
  }
  return cells;
}

export function qrSvgDataUrl(data: string, px = 120) {
  const size = 21;
  const modules = qrModules(data, size);
  const s = px / size;
  const rects = modules
    .flatMap((row, y) => row.map((on, x) => (on ? `<rect x="${x * s}" y="${y * s}" width="${s}" height="${s}"/>` : "")))
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}"><rect width="${px}" height="${px}" fill="#fff"/>${rects}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
