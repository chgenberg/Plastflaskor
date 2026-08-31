import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aquavisibility.se";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/designa", "/offert", "/login", "/kassa", "/konto", "/operations", "/labels", "/bottler"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
