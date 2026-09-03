import assert from "node:assert/strict";
import { test } from "node:test";
import { inIsoWeek, isoWeekBounds, supplierActionLabel, supplierCounts } from "./supplierDesk";

test("iso week contains monday through sunday", () => {
  const wednesday = new Date("2026-09-02T12:00:00");
  const { start, end } = isoWeekBounds(wednesday);
  assert.equal(start, "2026-08-31");
  assert.equal(end, "2026-09-06");
  assert.equal(inIsoWeek("2026-09-02", wednesday), true);
  assert.equal(inIsoWeek("2026-09-07", wednesday), false);
});

test("label counts accept vs active", () => {
  const visible = [
    { order: { currentStatus: "LABEL_PRODUCTION", factoryDeadlineAccepted: false, factoryDeadline: "2026-09-03" } },
    { order: { currentStatus: "LABEL_PRODUCTION", factoryDeadlineAccepted: true, factoryDeadline: "2026-09-10" } },
  ];
  const counts = supplierCounts(visible, [], "label", new Date("2026-09-02T12:00:00"));
  assert.equal(counts.toAccept, 1);
  assert.equal(counts.active, 1);
  assert.equal(counts.dueThisWeek, 1);
});

test("bottler counts dispatched as toAccept", () => {
  const visible = [
    { order: { currentStatus: "LABELS_DISPATCHED", factoryDeadlineAccepted: true } },
    { order: { currentStatus: "IN_PRODUCTION", factoryDeadlineAccepted: true, aquaApprovedDelivery: "2026-09-04" } },
  ];
  const counts = supplierCounts(visible, [{ order: { currentStatus: "SHIPPED", factoryDeadlineAccepted: true } }], "bottler", new Date("2026-09-02T12:00:00"));
  assert.equal(counts.toAccept, 1);
  assert.equal(counts.active, 1);
  assert.equal(counts.dueThisWeek, 1);
  assert.equal(counts.shipped, 1);
  assert.equal(supplierActionLabel("bottler", visible[0]!), "Ta emot etiketter");
});
