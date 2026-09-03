import assert from "node:assert/strict";
import { test } from "node:test";
import { matchVariant, unique } from "./bottleVariants";

test("unique keeps first-seen order", () => {
  assert.deepEqual(unique([330, 500, 330]), [330, 500]);
});

test("matchVariant prefers volume + water then volume", () => {
  const variants = [
    { id: "a", volumeMl: 330, waterType: "stilla" as const },
    { id: "b", volumeMl: 330, waterType: "kolsyrat" as const },
    { id: "c", volumeMl: 500, waterType: "stilla" as const },
    { id: "d", volumeMl: 330, waterType: "lime" as const },
  ];
  assert.equal(matchVariant(variants, 330, "kolsyrat")?.id, "b");
  assert.equal(matchVariant(variants, 330, "lime")?.id, "d");
  assert.equal(matchVariant(variants, 500, "kolsyrat")?.id, "c");
});
