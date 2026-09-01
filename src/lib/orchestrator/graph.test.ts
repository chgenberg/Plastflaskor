import assert from "node:assert/strict";
import { test } from "node:test";
import { EDGES, HOUSE_TAIL, HOUSE_TRACKS, PLAYBOOKS } from "./graph";

test("house has the three paper tracks", () => {
  assert.deepEqual(
    HOUSE_TRACKS.map((t) => t.label),
    ["Etiketter", "Bottler", "Kund"],
  );
  assert.ok(HOUSE_TRACKS[0].steps.some((s) => s.label === "accept ETD"));
  assert.ok(HOUSE_TRACKS[1].steps.some((s) => s.label === "FRAKT"));
  assert.ok(HOUSE_TRACKS[2].steps.some((s) => s.label === "POA"));
});

test("house tail is Frakt → POD → Faktura", () => {
  assert.deepEqual(
    HOUSE_TAIL.map((s) => s.label),
    ["Frakt", "POD", "Faktura"],
  );
});

test("paper edges: etikett POD to bottler, bottler to FRAKT, FRAKT to faktura", () => {
  const ids = EDGES.map((e) => e.id);
  assert.ok(ids.includes("labels-bottler"));
  assert.ok(ids.includes("bottler-freight"));
  assert.ok(ids.includes("freight-money"));
  assert.equal(EDGES.find((e) => e.id === "labels-bottler")?.label, "POD");
  assert.equal(EDGES.find((e) => e.id === "bottler-freight")?.label, "FRAKT");
});

test("invoice playbook stays Fortnox-mock and human-gated", () => {
  const invoice = PLAYBOOKS.find((p) => p.id === "invoice");
  assert.ok(invoice?.blurb.includes("mock"));
  assert.ok(invoice?.blurb.includes("Människa"));
});
