import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCheckoutWater, CheckoutError, CHECKOUT_WATER_ONLY } from "./checkout.service";

test("only WATER can be ordered", () => {
  assert.doesNotThrow(() => assertCheckoutWater("WATER"));
  assert.throws(() => assertCheckoutWater("PAPER_CUP"), (err: unknown) => {
    assert.ok(err instanceof CheckoutError);
    assert.equal((err as CheckoutError).message, CHECKOUT_WATER_ONLY);
    return true;
  });
});
