export type ProductSelection = {
  productId: string;
  variantId: string;
  qty: number;
  options: { waterType: "stilla" | "kolsyrat"; cap?: string; color?: string };
  designId?: string;
};
