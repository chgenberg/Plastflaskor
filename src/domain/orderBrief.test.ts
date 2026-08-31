import assert from "node:assert/strict";
import { test } from "node:test";
import { buyerNextAction, buyerTimeline } from "./orderBrief";
import { invoiceBuyerLabel } from "./enums";

test("buyer timeline hides internal artwork and stays on mottagen until OB", () => {
  const steps = buyerTimeline("ARTWORK_CUSTOMER_APPROVAL");
  assert.equal(steps.some((s) => s.id === "artwork"), false);
  assert.equal(steps.find((s) => s.id === "received")?.current, true);
  assert.equal(steps.find((s) => s.id === "confirmed")?.done, false);
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

test("invoice labels paid unpaid overdue", () => {
  assert.equal(invoiceBuyerLabel("PAID"), "Betald");
  assert.equal(invoiceBuyerLabel("ISSUED"), "Obetald");
  assert.equal(invoiceBuyerLabel("ISSUED", "2020-01-01"), "Förfallen");
});
