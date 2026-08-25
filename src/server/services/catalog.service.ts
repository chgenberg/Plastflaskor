import { prisma } from "../db";
import { canSeePrices } from "@/domain/policies/priceVisibility";

export async function listCategories() {
  const products = await prisma.product.findMany({
    where: { isPublic: true },
    orderBy: { sortOrder: "asc" },
    select: { categorySlug: true, category: true },
  });
  const seen = new Set<string>();
  return products
    .filter((p) => {
      if (seen.has(p.categorySlug)) return false;
      seen.add(p.categorySlug);
      return true;
    })
    .map((p) => p.categorySlug);
}

export async function listProducts(categorySlug?: string) {
  return prisma.product.findMany({
    where: { isPublic: true, ...(categorySlug ? { categorySlug } : {}) },
    orderBy: { sortOrder: "asc" },
    include: { variants: true },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { variants: true },
  });
}

export async function getPublicProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isPublic: true },
    include: { variants: true },
  });
}

export async function getPricesForReseller(resellerId: string, variantId?: string) {
  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    include: {
      priceList: {
        include: {
          items: {
            where: variantId ? { variantId } : undefined,
            include: { variant: { include: { product: true } } },
            orderBy: { minQty: "asc" },
          },
        },
      },
    },
  });
  return reseller?.priceList ?? null;
}

export function resolveUnitPrice(
  items: { variantId: string; minQty: number; unitPriceExVat: number }[],
  variantId: string,
  qty: number,
) {
  const matches = items.filter((i) => i.variantId === variantId && qty >= i.minQty);
  if (!matches.length) return null;
  return matches.sort((a, b) => b.minQty - a.minQty)[0];
}

export function assertCanSeePrices(role?: string | null) {
  if (!canSeePrices(role)) {
    throw new Error("Priser visas endast för inloggade återförsäljare.");
  }
}
