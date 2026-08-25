import assert from "node:assert/strict";
import { test } from "node:test";
import { publicProductDto } from "./catalog.service";

test("public product DTO never carries unit prices", () => {
  const dto = publicProductDto({
    name: "Test",
    variants: [
      {
        id: "v1",
        sku: "x",
        name: "33 cl",
        volumeMl: 330,
        packSize: 1,
        optionsJson: "{}",
        unitPriceExVat: 12.5,
      } as { id: string; sku: string; name: string; volumeMl: number | null; packSize: number; optionsJson: string } & {
        unitPriceExVat?: number;
      },
    ],
  });
  const json = JSON.stringify(dto);
  assert.equal(json.includes("unitPrice"), false);
  assert.equal(json.includes("12.5"), false);
});
