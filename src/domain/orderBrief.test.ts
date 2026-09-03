import assert from "node:assert/strict";
import { test } from "node:test";
import { buyerNextAction, buyerTimeline, customerActionFor, needsNewArtworkAfterReject } from "./orderBrief";
import { invoiceBuyerLabel } from "./enums";

test("buyer timeline shows artwork and korr before OB", () => {
  const steps = buyerTimeline("ARTWORK_CUSTOMER_APPROVAL", "proof");
  assert.equal(steps.some((s) => s.id === "artwork"), true);
  assert.equal(steps.find((s) => s.id === "proof")?.current, true);
  assert.equal(steps.find((s) => s.id === "confirmed")?.done, false);
  assert.equal(steps.length, 8);
});

test("buyer next action prefers proof", () => {
  const next = buyerNextAction([
    { orderNo: "AV-1", currentStatus: "SHIPPED" },
    { orderNo: "AV-2", currentStatus: "ARTWORK_CUSTOMER_APPROVAL" },
  ]);
  assert.equal(next.hrefSuffix, "/ordrar/AV-2");
  assert.match(next.title, /korrektur/i);
});

test("buyer next action waits for OB when proof already approved", () => {
  const next = buyerNextAction([
    {
      orderNo: "AV-2",
      currentStatus: "ARTWORK_CUSTOMER_APPROVAL",
      artworkApprovals: [{ kind: "CUSTOMER_FINAL" }],
    },
  ]);
  assert.equal(next.hrefSuffix, "/ordrar/AV-2");
  assert.match(next.title, /orderbekräftelse/i);
});

test("buyer next action still asks for unapproved proofs", () => {
  const next = buyerNextAction([
    {
      orderNo: "AV-1",
      currentStatus: "ARTWORK_CUSTOMER_APPROVAL",
      artworkApprovals: [{ kind: "CUSTOMER_FINAL" }],
    },
    { orderNo: "AV-2", currentStatus: "ARTWORK_CUSTOMER_APPROVAL" },
  ]);
  assert.equal(next.hrefSuffix, "/ordrar/AV-2");
  assert.match(next.title, /korrektur/i);
});

test("buyer next action copy uses artwork not wrap", () => {
  const empty = buyerNextAction([]);
  assert.match(empty.body, /artwork/i);
  assert.doesNotMatch(empty.body, /wrap/i);
  const next = buyerNextAction([{ orderNo: "AV-1", currentStatus: "CONFIRMED" }]);
  assert.match(next.body, /artwork/i);
  assert.doesNotMatch(next.body, /wrap/i);
});

test("customerActionFor asks for artwork after aqua reject", () => {
  assert.equal(
    customerActionFor({
      currentStatus: "AQUA_REVIEW",
      lockedAt: null,
      designs: [{ files: [{ id: "f1" }] }],
      artworkApprovals: [{ kind: "AQUA_REJECTED", createdAt: "2026-09-01T12:00:00.000Z" }],
      artworkVersions: [{ createdAt: "2026-09-01T10:00:00.000Z" }],
    }),
    "artwork",
  );
  assert.equal(
    needsNewArtworkAfterReject({
      artworkApprovals: [{ kind: "AQUA_REJECTED", createdAt: "2026-09-01T12:00:00.000Z" }],
      artworkVersions: [{ createdAt: "2026-09-01T13:00:00.000Z" }],
    }),
    false,
  );
  assert.equal(
    customerActionFor({
      currentStatus: "AQUA_REVIEW",
      lockedAt: null,
      designs: [{ files: [{ id: "f1" }] }],
      artworkApprovals: [{ kind: "AQUA_REJECTED", createdAt: "2026-09-01T12:00:00.000Z" }],
      artworkVersions: [{ createdAt: "2026-09-01T13:00:00.000Z" }],
    }),
    null,
  );
});

test("invoice labels paid unpaid overdue", () => {
  assert.equal(invoiceBuyerLabel("PAID"), "Betald");
  assert.equal(invoiceBuyerLabel("ISSUED"), "Obetald");
  assert.equal(invoiceBuyerLabel("ISSUED", "2020-01-01"), "Förfallen");
});
