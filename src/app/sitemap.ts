import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { getAllProductSlugs, getCategories, getCollections } from "@/lib/data/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages = ["", "/shop", "/collections", "/track-order", "/contact", "/faqs", "/shipping-policy", "/return-policy", "/cancellation-policy", "/privacy-policy", "/terms-and-conditions"];
  try {
    const [products, categories, collections] = await Promise.all([getAllProductSlugs(), getCategories(), getCollections()]);
    return [
      ...staticPages.map((p) => ({ url: `${siteUrl}${p}`, lastModified: now, changeFrequency: p ? ("weekly" as const) : ("daily" as const), priority: p ? 0.5 : 1 })),
      ...categories.map((c) => ({ url: `${siteUrl}/category/${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
      ...collections.map((c) => ({ url: `${siteUrl}/collections/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...products.map((p) => ({ url: `${siteUrl}/product/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.7 })),
    ];
  } catch {
    // Catalogue temporarily unreachable: still serve the static pages.
    return staticPages.map((p) => ({ url: `${siteUrl}${p}`, lastModified: now }));
  }
}
