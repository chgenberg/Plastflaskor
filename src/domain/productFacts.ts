export function parseOptions(optionsJson?: string | null) {
  try {
    return JSON.parse(optionsJson || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function volumeLabel(ml?: number | null) {
  if (!ml) return null;
  return ml % 10 === 0 && ml >= 100 ? `${ml / 10} cl` : `${ml} ml`;
}

export function productFacts(input: {
  moq: number;
  leadTimeText?: string | null;
  country?: string | null;
  environmentText?: string | null;
  volumeMl?: number | null;
  optionsJson?: string | null;
  specText?: string | null;
}) {
  const opt = parseOptions(input.optionsJson);
  const volume = volumeLabel(input.volumeMl);
  const rows = [
    { label: "Minsta beställningsantal", value: `${input.moq} st` },
    { label: "Flaskstorlek", value: volume },
    { label: "Stilla / kolsyrat", value: opt.waterType },
    { label: "Flaskvariant", value: opt.bottle ?? opt.pack },
    { label: "Kapsyl", value: opt.cap },
    { label: "Etikettyp", value: opt.label },
    { label: "Tryckteknik", value: opt.print ?? "Fyrfärgstryck" },
    { label: "Ungefärlig leveranstid", value: input.leadTimeText },
    { label: "Produktionsland", value: input.country },
    { label: "Miljö", value: input.environmentText },
  ];
  return rows.filter((r): r is { label: string; value: string } => Boolean(r.value));
}
