import assert from "node:assert/strict";
import { test } from "node:test";
import { exceptionSummary, exceptionsFor, tomorrowYmd } from "./exceptions";

test("aqua review and overdue become tasks", () => {
  const items = exceptionsFor([
    { orderNo: "AV-1", currentStatus: "AQUA_REVIEW", source: "customer_order", requestedDate: "2020-01-01" },
    { orderNo: "AV-2", currentStatus: "ARTWORK_AQUA_REVIEW", source: "reseller_order" },
  ]);
  const kinds = items.map((i) => i.kind);
  assert.ok(kinds.includes("review"));
  assert.ok(kinds.includes("artwork_aqua"));
  assert.ok(kinds.includes("overdue"));
  const summary = exceptionSummary(items);
  assert.ok(summary.some((s) => s.kind === "review" && s.count === 1));
  assert.equal(summary.find((s) => s.kind === "overdue")?.severity, "red");
});

test("paid orders are not overdue tasks", () => {
  const items = exceptionsFor([{ orderNo: "AV-3", currentStatus: "PAID", source: "repeat", requestedDate: "2020-01-01" }]);
  assert.equal(items.length, 0);
});

test("deadline tomorrow, factory issue and ready vs customer date", () => {
  const items = exceptionsFor([
    { orderNo: "AV-4", currentStatus: "IN_PRODUCTION", source: "ops", requestedDate: tomorrowYmd() },
    {
      orderNo: "AV-5",
      currentStatus: "IN_PRODUCTION",
      source: "ops",
      requestedDate: "2026-09-01",
      factoryIssueNote: "Maskinstopp",
      factoryDeadlineAccepted: false,
      factoryReadyEstimate: "2026-09-20",
    },
  ]);
  const kinds = items.map((i) => i.kind);
  assert.ok(kinds.includes("deadline_tomorrow"));
  assert.ok(kinds.includes("deadline_issue"));
  assert.ok(kinds.includes("ready_vs_requirement"));
  assert.ok(kinds.includes("ready_date"));
});

test("missing waybill vs mark shipped, delivered not invoiced", () => {
  const missing = exceptionsFor([{ orderNo: "AV-6", currentStatus: "READY_TO_SHIP", source: "ops", shipments: [] }]);
  assert.ok(missing.some((i) => i.kind === "waybill"));
  assert.ok(!missing.some((i) => i.kind === "mark_shipped"));

  const ready = exceptionsFor([
    { orderNo: "AV-7", currentStatus: "READY_TO_SHIP", source: "ops", shipments: [{ waybillNo: "WB-1" }] },
  ]);
  assert.ok(ready.some((i) => i.kind === "mark_shipped"));
  assert.ok(!ready.some((i) => i.kind === "waybill"));

  const billed = exceptionsFor([
    { orderNo: "AV-8", currentStatus: "DELIVERED", source: "ops", invoice: { status: "ISSUED" } },
  ]);
  assert.ok(!billed.some((i) => i.kind === "invoice"));

  const open = exceptionsFor([{ orderNo: "AV-9", currentStatus: "DELIVERED", source: "ops" }]);
  assert.ok(open.some((i) => i.kind === "invoice"));
});

test("deadline not accepted vs flagged issue", () => {
  const waiting = exceptionsFor([
    {
      orderNo: "AV-11",
      currentStatus: "CONFIRMED",
      source: "ops",
      factoryDeadlineAccepted: false,
    },
  ]);
  assert.ok(waiting.some((i) => i.kind === "deadline_unaccepted"));
  assert.ok(!waiting.some((i) => i.kind === "deadline_issue"));

  const flagged = exceptionsFor([
    {
      orderNo: "AV-12",
      currentStatus: "CONFIRMED",
      source: "ops",
      factoryDeadlineAccepted: false,
      factoryIssueNote: "Kan inte hålla deadline",
    },
  ]);
  assert.ok(flagged.some((i) => i.kind === "deadline_issue"));
  assert.ok(!flagged.some((i) => i.kind === "deadline_unaccepted"));
});

test("overdue proof after three days", () => {
  const sent = new Date();
  sent.setDate(sent.getDate() - 4);
  const items = exceptionsFor([
    {
      orderNo: "AV-10",
      currentStatus: "ARTWORK_CUSTOMER_APPROVAL",
      source: "ops",
      artworkApprovals: [{ kind: "AQUA_PROOF", createdAt: sent }],
    },
  ]);
  assert.ok(items.some((i) => i.kind === "overdue_proof"));
  assert.ok(items.some((i) => i.kind === "artwork_customer"));
});
