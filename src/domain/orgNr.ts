export function normalizeOrgNr(raw: string) {
  return raw.replace(/\D/g, "");
}

export function formatOrgNr(digits: string) {
  const d = normalizeOrgNr(digits);
  if (d.length !== 10) return d;
  return `${d.slice(0, 6)}-${d.slice(6)}`;
}

/** Luhn mod 10 på 10 siffror (svenskt org.nr). */
export function isValidOrgNr(raw: string) {
  const d = normalizeOrgNr(raw);
  if (!/^\d{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let n = Number(d[i]);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}
