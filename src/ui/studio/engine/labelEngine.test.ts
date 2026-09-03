import assert from "node:assert/strict";
import { test } from "node:test";
import { bleedPct, clamp, keyboardDelta, safePct, safeY, scaleStep, snap, wrapInsets } from "./geometry";
import { defaultLayers, wrapForVolume } from "./types";

const DEFAULT_WRAP = { widthMm: 220, heightMm: 90, bleedMm: 3 };

test("clamp keeps values inside the closed range", () => {
  assert.equal(clamp(50, 0, 100), 50);
  assert.equal(clamp(-4, 1.36, 98.64), 1.36);
  assert.equal(clamp(200, 1.36, 98.64), 98.64);
  assert.equal(clamp(1.36, 1.36, 98.64), 1.36);
  assert.equal(clamp(98.64, 1.36, 98.64), 98.64);
});

test("snap uses first target within the 1.4 threshold, not the nearest", () => {
  assert.equal(snap(50, [50, 2.7, 97.3]), 50);
  assert.equal(snap(48.6, [50, 2.7, 97.3]), 50);
  assert.equal(snap(48.59, [50, 2.7, 97.3]), 48.59);
  assert.equal(snap(51.4, [50], 1.4), 50);
  assert.equal(snap(51.41, [50], 1.4), 51.41);
  assert.equal(snap(10, []), 10);
  assert.equal(snap(3.5, [50, 2.7, 4.1]), 2.7);
});

test("bleed and safe insets match the dieline math on the default wrap", () => {
  assert.equal(bleedPct(DEFAULT_WRAP), (3 / 220) * 100);
  assert.equal(safePct(DEFAULT_WRAP), (6 / 220) * 100);
  assert.equal(safeY(DEFAULT_WRAP), (6 / 90) * 100);
  assert.ok(bleedPct(DEFAULT_WRAP) < safePct(DEFAULT_WRAP));
  assert.ok(safePct(DEFAULT_WRAP) < 50);
});

test("wrapForVolume sizes feed the same insets the canvas paints", () => {
  const small = wrapForVolume(120);
  const mid = wrapForVolume(330);
  const large = wrapForVolume(500);
  assert.deepEqual(small, { widthMm: 170, heightMm: 62, bleedMm: 3 });
  assert.deepEqual(mid, { widthMm: 220, heightMm: 90, bleedMm: 3 });
  assert.deepEqual(large, { widthMm: 260, heightMm: 110, bleedMm: 3 });
  assert.deepEqual(wrapForVolume(null), mid);
  assert.deepEqual(wrapForVolume(undefined), mid);

  for (const wrap of [small, mid, large]) {
    const bleed = bleedPct(wrap);
    assert.ok(bleed > 0 && bleed < 50);
    assert.equal(clamp(0, bleed, 100 - bleed), bleed);
    assert.equal(clamp(100, bleed, 100 - bleed), 100 - bleed);
  }
});

test("keyboardDelta is 1 percent, or 5 with shift", () => {
  assert.deepEqual(keyboardDelta("ArrowLeft", false), [-1, 0]);
  assert.deepEqual(keyboardDelta("ArrowRight", false), [1, 0]);
  assert.deepEqual(keyboardDelta("ArrowUp", false), [0, -1]);
  assert.deepEqual(keyboardDelta("ArrowDown", false), [0, 1]);
  assert.deepEqual(keyboardDelta("ArrowLeft", true), [-5, 0]);
  assert.deepEqual(keyboardDelta("ArrowDown", true), [0, 5]);
  assert.equal(keyboardDelta("a", false), undefined);
  assert.equal(keyboardDelta("+", false), undefined);
  assert.equal(keyboardDelta("]", true), undefined);
});

test("scaleStep walks 0.1 and stops at 0.3 / 4", () => {
  assert.equal(scaleStep(1, 1), 1.1);
  assert.equal(scaleStep(1, -1), 0.9);
  assert.equal(scaleStep(0.3, -1), 0.3);
  assert.equal(scaleStep(0.35, -1), 0.3);
  assert.equal(scaleStep(4, 1), 4);
  assert.equal(scaleStep(3.95, 1), 4);
  let s = 1;
  for (let i = 0; i < 80; i++) s = scaleStep(s, 1);
  assert.equal(s, 4);
  s = 1;
  for (let i = 0; i < 80; i++) s = scaleStep(s, -1);
  assert.equal(s, 0.3);
});

test("nudge + clamp + snap stays inside bleed for thousands of walks", () => {
  const wraps = [wrapForVolume(120), wrapForVolume(330), wrapForVolume(500)];
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"] as const;
  for (const wrap of wraps) {
    const { bleedX, bleedY, safeX, safeY: sy } = wrapInsets(wrap);
    const xs = [50, safeX, 100 - safeX];
    const ys = [50, sy, 100 - sy];
    let x = 50;
    let y = 50;
    for (let i = 0; i < 4000; i++) {
      const delta = keyboardDelta(keys[i % 4], i % 7 === 0);
      assert.ok(delta);
      x = snap(clamp(x + delta[0], bleedX, 100 - bleedX), xs);
      y = snap(clamp(y + delta[1], bleedY, 100 - bleedY), ys);
      assert.ok(x >= bleedX - 1e-9 && x <= 100 - bleedX + 1e-9, `x=${x} bleedX=${bleedX}`);
      assert.ok(y >= bleedY - 1e-9 && y <= 100 - bleedY + 1e-9, `y=${y} bleedY=${bleedY}`);
    }
  }
});

test("snap never jumps farther than its threshold", () => {
  const targets = [50, 2.727, 97.273];
  for (let n = -5; n <= 105; n += 0.1) {
    const s = snap(Number(n.toFixed(4)), targets);
    if (s !== Number(n.toFixed(4))) {
      assert.ok(Math.abs(s - n) <= 1.4 + 1e-9, `${n} → ${s}`);
      assert.ok(targets.includes(s));
    }
  }
});

test("defaultLayers is the four-slot studio start state", () => {
  const layers = defaultLayers();
  assert.deepEqual(
    layers.map((l) => l.id),
    ["artwork", "logo", "text", "qr"],
  );
  assert.equal(layers[0].x, 50);
  assert.equal(layers[0].type, "artwork");
  assert.equal(layers[3].scale, 0.7);
});
