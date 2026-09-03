#!/usr/bin/env npx tsx
/**
 * Read-only: anonym HTML på publika sidor får inte innehålla kr / unitPriceExVat / minQty.
 * QA_BASE default http://localhost:3000
 */
const BASE = (process.env.QA_BASE ?? "http://localhost:3000").replace(/\/$/, "");
/** Currency "kr", not Swedish stems like "krävs". */
const BAD = /(?<![A-Za-zÅÄÖåäö])kr(?![A-Za-zÅÄÖåäö])|unitPriceExVat|minQty/i;

const PATHS = [
  "/",
  "/produkter",
  "/produkter/profilvatten",
  "/produkter/profilvatten/naturligt-mineralvatten-33cl",
  "/produkter/profilvatten/naturligt-mineralvatten-50cl",
  "/valmojligheter",
  "/inspiration",
  "/miljo",
  "/om",
  "/offert",
  "/login",
  "/kassa",
];

async function main() {
  const findings: string[] = [];
  for (const path of PATHS) {
    const url = `${BASE}${path}`;
    let res: Response;
    try {
      res = await fetch(url, { redirect: "follow", headers: { Accept: "text/html" } });
    } catch (err) {
      findings.push(`CRITICAL ${url} — kunde inte nås (${err instanceof Error ? err.message : err})`);
      continue;
    }
    if (res.status >= 500) {
      findings.push(`CRITICAL ${url} — HTTP ${res.status}`);
      continue;
    }
    if (res.status >= 400) {
      findings.push(`MEDIUM ${url} — HTTP ${res.status}`);
      continue;
    }
    const html = await res.text();
    if (BAD.test(html)) {
      findings.push(`CRITICAL ${url} — pris/kr i anonym HTML`);
    }
  }
  if (findings.length) {
    console.error(findings.join("\n"));
    process.exit(1);
  }
  console.log(`no-kr-public OK mot ${BASE} (${PATHS.length} sidor)`);
}

main();
