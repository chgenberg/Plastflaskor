import type { PlanCap, PlanSize, PlanWater } from "@/domain/bottlerPlan";
import { planLabels } from "@/domain/bottlerPlan";

export type BottlerPlanPage = {
  orderNo: string;
  customer: string;
  product: string;
  qty: number;
  size: PlanSize;
  water: PlanWater;
  cap: PlanCap;
  artworkTitle?: string;
  artworkJpeg?: Buffer;
};

const CAP_RGB: Record<PlanCap, string> = {
  svart: "0.10 0.10 0.10",
  vit: "0.96 0.96 0.96",
  bla: "0.12 0.35 0.67",
  rod: "0.77 0.12 0.12",
};

const WATER_RGB: Record<PlanWater, string> = {
  stilla: "0.77 0.87 0.91",
  kolsyrat: "0.66 0.82 0.87",
  citron: "0.91 0.89 0.60",
};

function winAnsi(input: string) {
  return input
    .replace(/Å/g, "\xC5")
    .replace(/Ä/g, "\xC4")
    .replace(/Ö/g, "\xD6")
    .replace(/å/g, "\xE5")
    .replace(/ä/g, "\xE4")
    .replace(/ö/g, "\xF6")
    .replace(/É/g, "\xC9")
    .replace(/é/g, "\xE9")
    .replace(/[·•]/g, "\xB7")
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\xFF]/g, "?");
}

function escapePdf(input: string) {
  return winAnsi(input).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function jpegSize(bytes: Buffer): { w: number; h: number } | null {
  if (bytes.length < 8 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { h: (bytes[i + 5] << 8) | bytes[i + 6], w: (bytes[i + 7] << 8) | bytes[i + 8] };
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    i += 2 + len;
  }
  return null;
}

function text(x: number, y: number, size: number, value: string, bold = false) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdf(value)}) Tj ET`;
}

function rect(x: number, y: number, w: number, h: number, fill?: string, stroke?: string) {
  const ops = [`${x} ${y} ${w} ${h} re`];
  if (fill && stroke) return `${fill} rg ${stroke} RG ${ops[0]} B`;
  if (fill) return `${fill} rg ${ops[0]} f`;
  if (stroke) return `${stroke} RG ${ops[0]} S`;
  return "";
}

function bottleOps(page: BottlerPlanPage) {
  const tall = page.size === "50";
  const bodyH = tall ? 268 : 206;
  const bodyY = tall ? 248 : 290;
  const cx = 456;
  const bodyW = 108;
  const bodyX = cx - bodyW / 2;
  const neckH = 34;
  const capH = 26;
  const capW = 52;
  const capX = cx - capW / 2;
  const neckX = cx - 12;
  const capY = bodyY + bodyH + neckH;
  const labelH = Math.round(bodyH * 0.38);
  const labelY = bodyY + Math.round(bodyH * 0.28);
  const labelW = 72;
  const labelX = cx - labelW / 2;
  const ops = [
    `${WATER_RGB[page.water]} rg`,
    `${bodyX} ${bodyY} ${bodyW} ${bodyH} re f`,
    `${cx - 36} ${bodyY + bodyH - 8} 72 18 re f`,
    "0.84 0.89 0.91 rg",
    `${neckX} ${bodyY + bodyH} 24 ${neckH} re f`,
    `${CAP_RGB[page.cap]} rg`,
    `${capX} ${capY} ${capW} ${capH} re f`,
    `${capX + 2} ${capY + capH - 5} ${capW - 4} 5 re f`,
  ];
  if (page.cap === "vit") {
    ops.push("0.70 0.70 0.70 RG", `${capX} ${capY} ${capW} ${capH} re S`);
  }
  ops.push(
    "1 1 1 rg",
    `${bodyX + 10} ${bodyY + 28} 7 ${Math.round(bodyH * 0.45)} re f`,
    "0.99 0.99 0.96 rg",
    "0.55 0.53 0.48 RG",
    `${labelX} ${labelY} ${labelW} ${labelH} re B`,
  );
  if (page.water === "kolsyrat") {
    ops.push(
      "1 1 1 rg",
      `${cx - 18} ${bodyY + 48} 4 4 re f`,
      `${cx + 10} ${bodyY + 78} 3 3 re f`,
      `${cx - 8} ${bodyY + 110} 3 3 re f`,
    );
  }
  const labels = planLabels(page);
  ops.push(text(labelX + 6, labelY + labelH / 2, 8, page.artworkTitle || "Etikett"));
  ops.push(text(cx - 70, bodyY - 22, 9, `${labels.size} · ${labels.water}`));
  ops.push(text(cx - 70, bodyY - 36, 9, labels.cap));
  return ops;
}

function pageStream(page: BottlerPlanPage, index: number, total: number, hasArt: boolean) {
  const labels = planLabels(page);
  const ops = [
    text(48, 800, 9, "BOTTLER-PLAN  ·  EN SIDA PER ORDER"),
    text(48, 772, 20, page.orderNo, true),
    text(48, 750, 12, page.customer),
    text(48, 732, 11, `${page.product}   ${page.qty.toLocaleString("sv-SE")} st`),
    text(48, 710, 11, `${labels.size}  ·  ${labels.water}  ·  ${labels.cap}`),
    rect(48, 430, 280, 248, "0.998 0.996 0.973", "0.78 0.75 0.70"),
    text(60, 652, 8, page.size === "50" ? "ETIKETT  ·  WRAP 210 x 90 mm" : "ETIKETT  ·  WRAP 170 x 80 mm"),
  ];
  if (hasArt) {
    ops.push("q", "256 0 0 160 60 456 cm", "/Im1 Do", "Q");
  } else {
    ops.push(
      text(60, 620, 14, page.artworkTitle || page.product, true),
      text(60, 598, 11, page.product),
      text(60, 580, 11, `${labels.size} · ${labels.water}`),
      text(60, 562, 11, `${page.qty.toLocaleString("sv-SE")} st`),
    );
  }
  ops.push(...bottleOps(page));
  ops.push(text(48, 40, 8, "Ingen pris- eller fakturainformation. Samma flaska som på orderbekräftelsen."));
  ops.push(text(500, 40, 8, `${index + 1} / ${total}`));
  return ops.filter(Boolean).join("\n");
}

function pdfFromObjects(objects: Buffer[]) {
  const header = Buffer.from("%PDF-1.4\n", "latin1");
  const offsets = [0];
  let body = header;
  for (const obj of objects) {
    offsets.push(body.length);
    body = Buffer.concat([body, obj]);
  }
  const xrefPos = body.length;
  const xrefLines = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];
  for (let i = 1; i < offsets.length; i++) {
    xrefLines.push(`${String(offsets[i]).padStart(10, "0")} 00000 n `);
  }
  const xref = Buffer.from(`${xrefLines.join("\n")}\n`, "latin1");
  const trailer = Buffer.from(
    `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`,
    "latin1",
  );
  return Buffer.concat([body, xref, trailer]);
}

export function renderBottlerPlanPdf(pages: BottlerPlanPage[]) {
  const items = pages.length
    ? pages
    : [
        {
          orderNo: "Inga jobb",
          customer: "Inga ordrar matchar filtret",
          product: "–",
          qty: 0,
          size: "33" as const,
          water: "stilla" as const,
          cap: "svart" as const,
        },
      ];

  const catalog = Buffer.from("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n", "latin1");
  const font = Buffer.from(
    "3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj\n",
    "latin1",
  );
  const fontBold = Buffer.from(
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj\n",
    "latin1",
  );

  const kids: string[] = [];
  const rest: Buffer[] = [];
  let next = 5;
  items.forEach((page, index) => {
    const jpeg = page.artworkJpeg && jpegSize(page.artworkJpeg) ? page.artworkJpeg : undefined;
    const jpegInfo = jpeg ? jpegSize(jpeg) : null;
    let imageNum = 0;
    if (jpeg && jpegInfo) {
      imageNum = next++;
      const dict = `<< /Type /XObject /Subtype /Image /Width ${jpegInfo.w} /Height ${jpegInfo.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`;
      rest.push(
        Buffer.concat([
          Buffer.from(`${imageNum} 0 obj ${dict} stream\n`, "latin1"),
          jpeg,
          Buffer.from("\nendstream\nendobj\n", "latin1"),
        ]),
      );
    }
    const contentNum = next++;
    const pageNum = next++;
    const stream = pageStream(page, index, items.length, Boolean(imageNum));
    const streamBuf = Buffer.from(stream, "latin1");
    rest.push(
      Buffer.concat([
        Buffer.from(`${contentNum} 0 obj << /Length ${streamBuf.length} >> stream\n`, "latin1"),
        streamBuf,
        Buffer.from("\nendstream\nendobj\n", "latin1"),
      ]),
    );
    const xobj = imageNum ? `/XObject << /Im1 ${imageNum} 0 R >>` : "";
    rest.push(
      Buffer.from(
        `${pageNum} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentNum} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xobj} >> >> endobj\n`,
        "latin1",
      ),
    );
    kids.push(`${pageNum} 0 R`);
  });

  const pagesObj = Buffer.from(
    `2 0 obj << /Type /Pages /Kids [${kids.join(" ")}] /Count ${kids.length} >> endobj\n`,
    "latin1",
  );
  return pdfFromObjects([catalog, pagesObj, font, fontBold, ...rest]);
}
