import type { MetadataRoute } from "next";
import { listProducts } from "@/server/services/catalog.service";
import { CATEGORY_META } from "@/domain/enums";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aquavisibility.se";
  const staticPaths = ["", "/produkter", "/inspiration", "/ovriga", "/aterforsaljare", "/om", "/miljo", "/nyheter", "/valmojligheter"];
  const categories = Object.keys(CATEGORY_META).map((slug) => `/produkter/${slug}`);
  let productPaths: string[] = [];
  try {
    const products = await listProducts();
    productPaths = products.map((p) => `/produkter/${p.categorySlug}/${p.slug}`);
  } catch {
    productPaths = [];
  }
  return [...staticPaths, ...categories, ...productPaths].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));
}
