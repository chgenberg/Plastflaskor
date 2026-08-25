import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutToken, isStripeTestCard } from "./checkout.service";

test("only Stripe test PAN 4242 is accepted", () => {
  assert.equal(isStripeTestCard("4242 4242 4242 4242"), true);
  assert.equal(isStripeTestCard("4242424242424242"), true);
  assert.equal(isStripeTestCard("4000000000000002"), false);
});

test("checkout token is stable for the same order", () => {
  const a = checkoutToken("AV-10999");
  const b = checkoutToken("AV-10999");
  assert.equal(a, b);
  assert.notEqual(a, checkoutToken("AV-10998"));
});
