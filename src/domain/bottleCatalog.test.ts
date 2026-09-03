import assert from "node:assert/strict";
import { test } from "node:test";
import {
  capLabel,
  parseWaterKind,
  waterKindFromOptionsJson,
  waterTypeForOrder,
} from "./bottleCatalog";

test("parseWaterKind keeps citron/lime off the sparkling chip", () => {
  assert.equal(parseWaterKind("kolsyrat citron/lime"), "lime");
  assert.equal(parseWaterKind("kolsyrat"), "kolsyrat");
  assert.equal(parseWaterKind("stilla"), "stilla");
});

test("waterKindFromOptionsJson reads seed lime SKU", () => {
  assert.equal(waterKindFromOptionsJson(JSON.stringify({ waterType: "kolsyrat citron/lime" })), "lime");
  assert.equal(waterTypeForOrder("lime"), "kolsyrat");
});

test("capLabel names skruvkork as SKRUVKORK", () => {
  assert.equal(capLabel("skruvkork"), "SKRUVKORK");
  assert.equal(capLabel("sportkork"), "SPORTKORK");
  assert.equal(capLabel("black"), "SVART KAPSYL");
  assert.equal(capLabel(undefined), "SKRUVKORK");
});
