function winAnsi(input: string) {
  return input.replace(/[^\x20-\x7EÅÄÖåäöÉéÜü]/g, "?");
}

function escapePdf(input: string) {
  return winAnsi(input).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function renderSimplePdf(title: string, lines: string[]) {
  const commands = [title, "", ...lines].map((line, i) => {
    const y = 800 - i * 18;
    const size = i === 0 ? 16 : 11;
    return `BT /F1 ${size} Tf 50 ${y} Td (${escapePdf(line)}) Tj ET`;
  });
  const stream = commands.join("\n");
  const streamBytes = Buffer.byteLength(stream, "latin1");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${streamBytes} >> stream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj\n",
  ];
  let offset = 9;
  const offsets = [0];
  let body = "";
  for (const obj of objects) {
    offsets.push(offset);
    body += obj;
    offset += Buffer.byteLength(obj, "latin1");
  }
  const xref = offsets
    .map((o, i) => (i === 0 ? "0000000000 65535 f \n" : `${String(o).padStart(10, "0")} 00000 n \n`))
    .join("");
  const pdf = `%PDF-1.4\n${body}xref\n0 ${offsets.length}\n${xref}trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}
