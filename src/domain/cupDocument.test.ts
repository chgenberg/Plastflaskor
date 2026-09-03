import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertRequiredPrintPlaced,
  emptyCupDocument,
  parseCupDocument,
  parseStudioCanvasJson,
  printGate,
  REQUIRED_PRINT_MESSAGE,
} from "./cupDocument";

test("printGate is ready when required items are placed", () => {
  assert.equal(printGate([]).ready, true);
  assert.equal(printGate([{ required: true, placed: false }]).ready, false);
  const gate = printGate([
    { required: true, placed: true },
    { required: true, placed: false },
    { required: false, placed: false },
  ]);
  assert.equal(gate.done, 1);
  assert.equal(gate.total, 2);
  assert.equal(gate.ready, false);
});

test("printGate treats missing and optional-only lists as ready", () => {
  assert.deepEqual(printGate(null), { done: 0, total: 0, ready: true });
  assert.deepEqual(printGate(undefined), { done: 0, total: 0, ready: true });
  assert.equal(printGate([{ required: false, placed: false }]).ready, true);
  assert.equal(printGate([{ placed: true }]).ready, true);
});

test("assertRequiredPrintPlaced throws the same copy as the studio CTA", () => {
  assert.doesNotThrow(() => assertRequiredPrintPlaced([]));
  assert.doesNotThrow(() => assertRequiredPrintPlaced([{ required: true, placed: true }]));
  assert.throws(() => assertRequiredPrintPlaced([{ required: true, placed: false }]), (err: unknown) => {
    assert.ok(err instanceof Error);
    assert.equal(err.message, REQUIRED_PRINT_MESSAGE);
    return true;
  });
});

test("parseCupDocument accepts a saved wrap and drops invalid JSON", () => {
  const raw = JSON.stringify({
    version: 1,
    productSlug: "stenkulla-33",
    quantity: 270,
    options: { wall: "enkel", eco: false, finish: "matte", lid: "none" },
    wrap: { widthMm: 220, heightMm: 90, bleedMm: 3 },
    layers: [{ id: "logo", x: 50 }],
    requirements: [{ code: "logo", label: "Logotyp", placed: true, required: true }],
  });
  const doc = parseCupDocument(raw);
  assert.ok(doc);
  assert.equal(doc.productSlug, "stenkulla-33");
  assert.equal(doc.quantity, 270);
  assert.equal(doc.wrap.bleedMm, 3);
  assert.equal(doc.layers.length, 1);

  assert.equal(parseCupDocument(null), null);
  assert.equal(parseCupDocument(""), null);
  assert.equal(parseCupDocument("{"), null);
  assert.equal(parseCupDocument("[]"), null);
  assert.equal(parseCupDocument(JSON.stringify({ productSlug: "x" })), null);
});

test("parseCupDocument rejects quantity, wrap and option violations", () => {
  const base = {
    version: 1,
    productSlug: "stenkulla-33",
    quantity: 270,
    options: { wall: "enkel", eco: false, finish: "matte", lid: "none" },
  };
  assert.equal(parseCupDocument(JSON.stringify({ ...base, quantity: 0 })), null);
  assert.equal(parseCupDocument(JSON.stringify({ ...base, quantity: 1.5 })), null);
  assert.equal(parseCupDocument(JSON.stringify({ ...base, wrap: { widthMm: 0, heightMm: 90, bleedMm: 3 } })), null);
  assert.equal(parseCupDocument(JSON.stringify({ ...base, wrap: { widthMm: 220, heightMm: 90, bleedMm: -1 } })), null);
  assert.equal(parseCupDocument(JSON.stringify({ ...base, options: { ...base.options, finish: "gloss" } })), null);
});

test("emptyCupDocument fills wrap and option defaults used by the studio", () => {
  const doc = emptyCupDocument({ productSlug: "vatten-fran-svensk-kalla-33cl", quantity: 270 });
  assert.equal(doc.version, 1);
  assert.deepEqual(doc.wrap, { widthMm: 220, heightMm: 90, bleedMm: 3 });
  assert.deepEqual(doc.options, { wall: "enkel", eco: false, finish: "matte", lid: "none" });
  assert.deepEqual(doc.layers, []);
  assert.deepEqual(doc.requirements, []);
});

test("emptyCupDocument → JSON → parseCupDocument is a roundtrip", () => {
  const layers = [{ id: "logo", type: "logo", x: 50, y: 46, scale: 1, rotation: 0 }];
  const doc = emptyCupDocument({
    productSlug: "stenkulla-33",
    quantity: 540,
    variantSku: "stenkulla-33-stilla",
    finish: "glossy",
    wrap: { widthMm: 260, heightMm: 110, bleedMm: 3 },
    layers,
    requirements: [{ code: "logo", label: "Logotyp", placed: true, required: true }],
  });
  const again = parseCupDocument(JSON.stringify(doc));
  assert.deepEqual(again, doc);
});

test("parseStudioCanvasJson returns layers or null the way applyDraft used to", () => {
  const layers = [
    { id: "artwork", type: "artwork", x: 50, y: 50, scale: 1, rotation: 0 },
    { id: "logo", type: "logo", x: 48, y: 46, scale: 1.2, rotation: 0 },
  ];
  const parsed = parseStudioCanvasJson(JSON.stringify({ layers, finish: "gloss", printFiles: ["a.pdf"], wrap: { widthMm: 220 } }));
  assert.ok(parsed);
  assert.equal(parsed.layers.length, 2);
  assert.equal((parsed.layers[1] as { id: string }).id, "logo");

  assert.equal(parseStudioCanvasJson("{}"), null);
  assert.equal(parseStudioCanvasJson(JSON.stringify({ layers: [] })), null);
  assert.equal(parseStudioCanvasJson(JSON.stringify({ layers: { id: "logo" } })), null);
  assert.equal(parseStudioCanvasJson("{"), null);
  assert.equal(parseStudioCanvasJson(""), null);
});

test("parseStudioCanvasJson stress: junk and sparse drafts never throw", () => {
  const junk = [
    "null",
    "true",
    "0",
    "\"layers\"",
    "[]",
    JSON.stringify({ layers: "logo" }),
    JSON.stringify({ layer: [{ id: "logo" }] }),
    "\u0000",
    " ".repeat(200),
    `${"[".repeat(40)}`,
  ];
  for (const raw of junk) {
    assert.equal(parseStudioCanvasJson(raw), null, raw);
  }

  const accepted = parseStudioCanvasJson(JSON.stringify({ layers: [null, 1, "x"] }));
  assert.ok(accepted);
  assert.equal(accepted.layers.length, 3);

  const huge = Array.from({ length: 400 }, (_, i) => ({ id: `l${i}`, x: i % 100, y: 50 }));
  const many = parseStudioCanvasJson(JSON.stringify({ layers: huge }));
  assert.ok(many);
  assert.equal(many.layers.length, 400);
});
