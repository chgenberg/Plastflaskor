import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLayers, normalizeLayers, parseStudioCanvas } from "./types";

test("normalizeLayers fills missing scale so the inspector cannot crash", () => {
  const layers = normalizeLayers([{ id: "logo", x: 22 }, { id: "unknown" }]);
  const logo = layers.find((l) => l.id === "logo");
  assert.equal(logo?.x, 22);
  assert.equal(typeof logo?.scale, "number");
  assert.equal(layers.length, defaultLayers().length);
});

test("parseStudioCanvas survives garbage and empty objects", () => {
  assert.equal(parseStudioCanvas("nope").layers.length, 4);
  assert.equal(parseStudioCanvas("{}").layers[0].type, "artwork");
  const parsed = parseStudioCanvas(
    JSON.stringify({ finish: "gloss", printFiles: ["a.ai"], layers: [{ id: "text", text: "HEJ", scale: 1.4 }] }),
  );
  assert.equal(parsed.finish, "gloss");
  assert.deepEqual(parsed.printFiles, ["a.ai"]);
  assert.equal(parsed.layers.find((l) => l.id === "text")?.text, "HEJ");
  assert.equal(parsed.layers.find((l) => l.id === "text")?.scale, 1.4);
});
