"use client";

import { useState } from "react";
import type { ProductSelection } from "@/domain/productSelection";
import { volumeLabel } from "@/domain/productFacts";
import { parseBottleOptions } from "@/domain/bottleCatalog";
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
  const volume = first ? volumeLabel(first.volumeMl) : null;
  const water = first ? parseBottleOptions(first.optionsJson).waterType : "stilla";

  return (
    <>
      <ProductConfigurator
        productId={productId}
        slug={slug}
        moq={moq}
        variants={variants}
        canSeePrices={canSeePrices}
        onOrder={setSelection}
      />
      <ProductStickyBar name={name} volume={volume ? `${volume} · ${water === "kolsyrat" ? "kolsyrat" : "stilla"}` : null} />
      {selection ? <OrderModal selection={selection} me={me} onClose={() => setSelection(null)} /> : null}
    </>
  );
}
