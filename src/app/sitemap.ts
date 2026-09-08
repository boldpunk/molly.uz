import type { MetadataRoute } from "next";
import { getCategories, getAllProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories(),
    getAllProducts(),
  ]);

  const staticRoutes = [
    "",
    "/catalog",
    "/about",
    "/delivery",
    "/contacts",
    "/privacy",
    "/terms",
    "/search",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const categoryRoutes = categories
    .filter((c) => !c.isPlaceholder)
    .map((c) => ({
      url: `${SITE_URL}/catalog/${c.slug}`,
      lastModified: new Date(),
    }));

  const productRoutes = products
    .filter((p) => !p.isSample)
    .map((p) => ({
      url: `${SITE_URL}/catalog/${p.categorySlug}/${p.slug}`,
      lastModified: new Date(),
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
