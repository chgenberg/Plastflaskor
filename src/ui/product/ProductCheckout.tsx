"use client";

import { useState } from "react";
import type { ProductSelection } from "@/domain/productSelection";
import { volumeLabel } from "@/domain/productFacts";
import { waterKindFromOptionsJson, waterKindLabel } from "@/domain/bottleCatalog";
import { OrderModal } from "@/ui/checkout/OrderModal";
import { ProductConfigurator, type ConfigVariant } from "./ProductConfigurator";
import { ProductStickyBar } from "./ProductStickyBar";

export function ProductCheckout({
  productId,
  slug,
  name,
  moq,
  variants,
  canSeePrices,
  me,
}: {
  productId: string;
  slug: string;
  name: string;
  moq: number;
  variants: ConfigVariant[];
  canSeePrices: boolean;
  me: { email: string; customerId: string | null } | null;
}) {
  const [selection, setSelection] = useState<ProductSelection | null>(null);
  const first = variants[0];
  const [preview, setPreview] = useState(() => ({
    volume: first ? volumeLabel(first.volumeMl) : null,
    water: first ? waterKindLabel(waterKindFromOptionsJson(first.optionsJson)) : "Stilla",
  }));
  const line = preview.volume ? `${preview.volume} · ${preview.water}` : null;

  return (
    <>
      <ProductConfigurator
        productId={productId}
        slug={slug}
        moq={moq}
        variants={variants}
        canSeePrices={canSeePrices}
        onOrder={setSelection}
        onPreview={setPreview}
      />
      <ProductStickyBar name={name} volume={line} />
      {selection ? <OrderModal selection={selection} me={me} onClose={() => setSelection(null)} /> : null}
    </>
  );
}
