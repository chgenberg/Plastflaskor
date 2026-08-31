import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contentDisposition, safeInternalPath } from "./safePath";

describe("safeInternalPath", () => {
  it("keeps relative app paths", () => {
    assert.equal(safeInternalPath("/konto/ordrar"), "/konto/ordrar");
  });
  it("rejects protocol-relative and absolute URLs", () => {
    assert.equal(safeInternalPath("//evil.example", "/"), "/");
    assert.equal(safeInternalPath("https://evil.example", "/"), "/");
    assert.equal(safeInternalPath("/\\evil", "/"), "/");
  });
});

describe("contentDisposition", () => {
  it("strips quotes and newlines from filenames", () => {
    assert.equal(contentDisposition('a"\r\nb.pdf', false), 'attachment; filename="a___b.pdf"');
  });
});
