import assert from "node:assert/strict";
import { test } from "node:test";
import { tryFixKey } from "./hands";

test("hands never touch irreversible or email-paused keys", async () => {
  assert.equal(await tryFixKey("ex:invoice:AV-1"), null);
  assert.equal(await tryFixKey("confirm:AV-1"), null);
  assert.equal(await tryFixKey("paid:AV-1"), null);
  assert.equal(await tryFixKey("email-paused"), null);
  assert.equal(await tryFixKey("nightly-error:x"), null);
});

test("hands stay inert until a safe cap is added", async () => {
  assert.equal(await tryFixKey("order-email:x"), null);
  assert.equal(await tryFixKey("anything"), null);
});
