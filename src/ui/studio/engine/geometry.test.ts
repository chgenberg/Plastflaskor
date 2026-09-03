import assert from "node:assert/strict";
import { test } from "node:test";
import { clamp, hudOffset, snap, wrapInsets } from "./geometry";

test("clamp and snap", () => {
  assert.equal(clamp(12, 0, 10), 10);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(snap(50.8, [50, 20], 1.4), 50);
  assert.equal(snap(48, [50], 1.4), 48);
});

test("wrapInsets use each axis so a 220×90 label is not treated as square", () => {
  const i = wrapInsets({ widthMm: 220, heightMm: 90, bleedMm: 3 });
  assert.ok(i.bleedY > i.bleedX);
  assert.ok(Math.abs(i.bleedX - (3 / 220) * 100) < 0.001);
  assert.ok(Math.abs(i.bleedY - (3 / 90) * 100) < 0.001);
  assert.ok(i.safeX > i.bleedX);
});

test("hudOffset undoes canvas zoom so the toolbar stays above the layer", () => {
  const host = { left: 100, top: 40, width: 400 };
  const box = { left: 180, top: 80, width: 80, height: 40 };
  const at1 = hudOffset(box, host, 1);
  const at2 = hudOffset(
    { left: 260, top: 120, width: 160, height: 80 },
    { left: 100, top: 40, width: 800 },
    2,
  );
  assert.equal(at1.left, at2.left);
  assert.equal(at1.top, at2.top);
});
