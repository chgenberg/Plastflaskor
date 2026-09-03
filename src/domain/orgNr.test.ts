import assert from "node:assert/strict";
import { test } from "node:test";
import { formatOrgNr, isValidOrgNr, normalizeOrgNr } from "./orgNr";

const valid = ["5598880101", "559888-0101"];

const invalid = [
  "5598880100",
  "1234567890",
  "559888010",
  "55988801011",
  "abcdefghij",
  "",
];

test("normalize and format", () => {
  assert.equal(normalizeOrgNr("559888-0101"), "5598880101");
  assert.equal(formatOrgNr("5598880101"), "559888-0101");
});

test("valid org numbers including seed", () => {
  for (const n of valid) assert.equal(isValidOrgNr(n), true, n);
});

test("invalid org numbers", () => {
  for (const n of invalid) assert.equal(isValidOrgNr(n), false, n);
});
