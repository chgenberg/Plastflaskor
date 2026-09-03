import assert from "node:assert/strict";
import { test } from "node:test";
import { statusHint, type HintFacts } from "./statusHint";

const base: HintFacts = { hasArtwork: true, customerApproved: false };

test("saknad artwork is blocked and names the viewer", () => {
  const facts = { ...base, hasArtwork: false };
  assert.equal(statusHint("AQUA_REVIEW", facts, "CUSTOMER").label, "Ladda upp artwork");
  assert.equal(statusHint("SUBMITTED", facts, "AQUA").label, "Saknar artwork");
  assert.equal(statusHint("SUBMITTED", facts, "CUSTOMER").tone, "blocked");
});

test("väntar på kundgodkännande differs for kund vs Aqua", () => {
  const facts = { ...base, customerApproved: false };
  assert.deepEqual(statusHint("ARTWORK_CUSTOMER_APPROVAL", facts, "CUSTOMER"), {
    label: "Godkänn korrektur",
    tone: "next",
  });
  assert.deepEqual(statusHint("ARTWORK_CUSTOMER_APPROVAL", facts, "AQUA"), {
    label: "Väntar på kund",
    tone: "idle",
  });
});

test("aqua reject asks customer for new artwork", () => {
  const facts = { ...base, artworkRejected: true };
  assert.deepEqual(statusHint("AQUA_REVIEW", facts, "CUSTOMER"), {
    label: "Ladda upp artwork",
    tone: "blocked",
  });
  assert.equal(statusHint("AQUA_REVIEW", facts, "AQUA").label, "Kund ska ladda upp ny artwork");
});

test("försenad and flaggad are blocked", () => {
  assert.equal(statusHint("IN_PRODUCTION", { ...base, requestedDate: "2020-01-01" }, "AQUA").label, "Försenad");
  assert.equal(
    statusHint("LABEL_PRODUCTION", { ...base, factoryIssueNote: "stopp", factoryDeadlineAccepted: false }, "LABEL")
      .label,
    "Problem flaggat",
  );
});

test("LABEL and BOTTLER never get Fakturerad or Betald", () => {
  for (const viewer of ["LABEL", "BOTTLER"] as const) {
    const invoiced = statusHint("INVOICED", base, viewer);
    const paid = statusHint("PAID", base, viewer);
    assert.doesNotMatch(invoiced.label, /Fakturerad|Betald/);
    assert.doesNotMatch(paid.label, /Fakturerad|Betald/);
    assert.equal(invoiced.label, "Klar");
  }
  assert.equal(statusHint("LABELS_DISPATCHED", base, "BOTTLER").label, "Ta emot etiketter");
});
