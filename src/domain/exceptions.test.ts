import assert from "node:assert/strict";
import { test } from "node:test";
import { exceptionSummary, exceptionsFor } from "./exceptions";

test("quote and overdue become tasks", () => {
  const items = exceptionsFor([
    { orderNo: "AV-1", currentStatus: "ORDER_RECEIVED", source: "public_quote", requestedDate: "2020-01-01" },
    { orderNo: "AV-2", currentStatus: "ARTWORK_UPLOADED", source: "reseller_order" },
  ]);
  const kinds = items.map((i) => i.kind);
  assert.ok(kinds.includes("quote"));
  assert.ok(kinds.includes("artwork_approval"));
  assert.ok(kinds.includes("overdue"));
  const summary = exceptionSummary(items);
  assert.ok(summary.some((s) => s.kind === "quote" && s.count === 1));
});

test("paid orders are not overdue tasks", () => {
  const items = exceptionsFor([{ orderNo: "AV-3", currentStatus: "PAID", source: "repeat", requestedDate: "2020-01-01" }]);
  assert.equal(items.length, 0);
});
