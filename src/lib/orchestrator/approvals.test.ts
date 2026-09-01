import assert from "node:assert/strict";
import { test } from "node:test";
import { canExecute, emailPausedFromEnv } from "./approvals";
import { groupOpenCards } from "./groups";
import { gateForKind, PULSE_KINDS, seedFromException } from "./probes";

test("none gate always runs", () => {
  assert.equal(canExecute({ gate: "none" }).ok, true);
});

test("irreversible never runs even with yes", () => {
  const d = canExecute({ gate: "irreversible", explicitYes: true, bugHuntClean: true });
  assert.equal(d.ok, false);
  assert.match(d.reason, /Fakturera/);
});

test("deploy needs hunt and yes", () => {
  assert.equal(canExecute({ gate: "deploy", explicitYes: true }).ok, false);
  assert.equal(canExecute({ gate: "deploy", bugHuntClean: true }).ok, false);
  assert.equal(canExecute({ gate: "deploy", bugHuntClean: true, explicitYes: true }).ok, true);
});

test("email respects pause", () => {
  assert.equal(canExecute({ gate: "email", explicitYes: true, emailPaused: true }).ok, false);
  assert.equal(canExecute({ gate: "email", explicitYes: true, emailPaused: false }).ok, true);
  assert.equal(emailPausedFromEnv({ EMAIL_PAUSED: "1" } as unknown as NodeJS.ProcessEnv), true);
});

test("pulse watches every dashboard exception kind", () => {
  assert.ok(PULSE_KINDS.includes("waybill"));
  assert.ok(PULSE_KINDS.includes("overdue"));
  assert.ok(PULSE_KINDS.includes("invoice"));
});

test("invoice exceptions are irreversible", () => {
  assert.equal(gateForKind("invoice"), "irreversible");
  assert.equal(gateForKind("review"), "none");
  const seed = seedFromException({
    kind: "invoice",
    label: "Ordrar är redo att faktureras",
    href: "/operations/ekonomi",
    orderNo: "AV-10491",
    severity: "yellow",
  });
  assert.equal(seed.key, "ex:invoice:AV-10491");
  assert.equal(seed.gate, "irreversible");
  assert.equal(seed.domainId, "money");
});

test("open cards group by kind", () => {
  const groups = groupOpenCards([
    {
      id: "ex:review:AV-1",
      title: "Nya ordrar behöver granskas · AV-1",
      body: "Öppna /operations/ordrar?alert=review",
      status: "inbox",
      domainId: "operations",
      playbook: "new-order",
      files: [],
      gate: "none",
      source: "heartbeat",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "ex:review:AV-2",
      title: "Nya ordrar behöver granskas · AV-2",
      body: "Öppna /operations/ordrar?alert=review",
      status: "inbox",
      domainId: "operations",
      playbook: "new-order",
      files: [],
      gate: "none",
      source: "heartbeat",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "ex:invoice:AV-3",
      title: "Ordrar är redo att faktureras · AV-3",
      body: "Öppna /operations/ekonomi",
      status: "inbox",
      domainId: "money",
      playbook: "invoice",
      files: [],
      gate: "irreversible",
      source: "heartbeat",
      createdAt: "",
      updatedAt: "",
    },
  ]);
  assert.equal(groups[0].id, "invoice");
  assert.equal(groups[0].count, 1);
  assert.equal(groups[1].id, "review");
  assert.equal(groups[1].count, 2);
  assert.equal(groups[1].href, "/operations/ordrar?alert=review");
});
