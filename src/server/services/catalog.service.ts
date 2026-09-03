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
    include: { variants: true, printRequirements: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function listHomeProducts() {
  return prisma.product.findMany({
    where: { isPublic: true, categorySlug: "profilvatten" },
    orderBy: { sortOrder: "asc" },
    take: 6,
    select: {
      slug: true,
      categorySlug: true,
      name: true,
      oneLiner: true,
      moq: true,
      leadTimeText: true,
    },
  });
}

export async function listWaterProducts() {
  return prisma.product.findMany({
    where: { category: "WATER" },
    orderBy: { sortOrder: "asc" },
    include: { variants: true, printRequirements: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { variants: true, printRequirements: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getPublicProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isPublic: true },
    include: { variants: true },
  });
}

export async function getPriceListForBuyer(input: { customerId: string; variantId?: string }) {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    include: {
      priceList: {
        include: {
          items: {
            where: input.variantId ? { variantId: input.variantId } : undefined,
            include: { variant: { include: { product: true } } },
            orderBy: { minQty: "asc" },
          },
        },
      },
    },
  });
  return (
    customer?.priceList ??
    (await prisma.priceList.findUnique({
      where: { code: "STANDARD" },
      include: {
        items: {
          where: input.variantId ? { variantId: input.variantId } : undefined,
          include: { variant: { include: { product: true } } },
          orderBy: { minQty: "asc" },
        },
      },
    }))
  );
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

export async function setPrintRequirementRequired(id: string, required: boolean) {
  return prisma.printRequirement.update({
    where: { id },
    data: { required },
  });
}

export async function updateWaterProduct(
  id: string,
  data: {
    moq: number;
    leadTimeDays: number;
    leadTimeText: string;
    printFormat?: string | null;
    oneLiner: string;
  },
) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("Produkten finns inte.");
  if (product.category !== "WATER") throw new Error("Endast profilvatten kan redigeras här.");
  if (!Number.isFinite(data.moq) || data.moq < 1) throw new Error("Minsta order måste vara minst 1.");
  if (!Number.isFinite(data.leadTimeDays) || data.leadTimeDays < 1) {
    throw new Error("Ledtid måste vara minst 1 dag.");
  }
  const printFormat = data.printFormat?.trim() ? data.printFormat.trim() : null;
  return prisma.product.update({
    where: { id },
    data: {
      moq: Math.floor(data.moq),
      leadTimeDays: Math.floor(data.leadTimeDays),
      leadTimeText: data.leadTimeText.trim(),
      printFormat,
      oneLiner: data.oneLiner.trim(),
    },
  });
}

export async function updatePriceListItem(id: string, data: { minQty: number; unitPriceExVat: number }) {
  const item = await prisma.priceListItem.findUnique({
    where: { id },
    include: { variant: { include: { product: { select: { category: true } } } } },
  });
  if (!item) throw new Error("Prisraden finns inte.");
  if (item.variant.product.category !== "WATER") {
    throw new Error("Endast profilvatten-rader kan redigeras.");
  }
  if (!Number.isFinite(data.minQty) || data.minQty < 1) throw new Error("Min antal måste vara minst 1.");
  if (!Number.isFinite(data.unitPriceExVat) || data.unitPriceExVat < 0) {
    throw new Error("Pris exkl. moms måste vara 0 eller mer.");
  }
  return prisma.priceListItem.update({
    where: { id },
    data: {
      minQty: Math.floor(data.minQty),
      unitPriceExVat: data.unitPriceExVat,
    },
  });
}

export async function listPriceLists() {
  return prisma.priceList.findMany({ orderBy: { name: "asc" } });
}

export async function listPriceListsAdmin() {
  return prisma.priceList.findMany({
    include: {
      _count: { select: { items: true, customers: true } },
      items: {
        where: { variant: { product: { category: "WATER" } } },
        select: {
          id: true,
          minQty: true,
          unitPriceExVat: true,
          variant: { select: { name: true, product: { select: { name: true } } } },
        },
        orderBy: [{ minQty: "asc" }, { unitPriceExVat: "asc" }],
      },
    },
    orderBy: { code: "asc" },
  });
}

const priceListWithItems = {
  include: {
    items: {
      include: { variant: { include: { product: true } } },
      orderBy: { minQty: "asc" as const },
    },
  },
};

export async function getPriceListPreview(listId?: string) {
  if (listId) {
    return prisma.priceList.findUnique({ where: { id: listId }, ...priceListWithItems });
  }
  return prisma.priceList.findUnique({ where: { code: "STANDARD" }, ...priceListWithItems });
}

export async function getPublicWaterVariant(variantId?: string) {
  if (variantId) {
    return prisma.productVariant.findFirst({
      where: { id: variantId, isActive: true, product: { category: "WATER", isPublic: true } },
      include: { product: true },
    });
  }
  return prisma.productVariant.findFirst({
    where: { isActive: true, product: { category: "WATER", isPublic: true, slug: "naturligt-mineralvatten-33cl" } },
    include: { product: true },
  });
}

export function assertCanSeePrices(role?: string | null) {
  if (!canSeePrices(role)) {
    throw new Error("Priser visas endast för inloggade köpare.");
  }
}

export function publicProductDto<T extends { variants: { id: string; sku: string; name: string; volumeMl: number | null; packSize: number; optionsJson: string }[] }>(
  product: T,
) {
  return {
    ...product,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      volumeMl: v.volumeMl,
      packSize: v.packSize,
      optionsJson: v.optionsJson,
    })),
  };
}
