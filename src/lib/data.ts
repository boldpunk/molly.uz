import { eq, and, ne, asc } from "drizzle-orm";
import { db } from "@/db";
import { categories as categoriesTable, products as productsTable } from "@/db/schema";
import { Category, Product } from "./types";

function toCategory(row: typeof categoriesTable.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isPlaceholder: row.isPlaceholder,
    sortOrder: row.sortOrder,
    filterKind: row.filterKind as Category["filterKind"],
  };
}

function toProduct(
  row: typeof productsTable.$inferSelect,
  categorySlug: string
): Product {
  return {
    id: row.id,
    categoryId: row.categoryId,
    categorySlug,
    slug: row.slug,
    name: row.name,
    specLine: row.specLine,
    description: row.description,
    pricingMode: row.pricingMode,
    pricePerMetre: row.pricePerMetre ?? undefined,
    hardwareOptions: row.hardwareOptions ?? undefined,
    colourOptions: row.colourOptions ?? undefined,
    collection: row.collection ?? undefined,
    attributes: row.attributes,
    isSample: row.isSample,
    isFeatured: row.isFeatured,
  };
}

export async function getCategories(): Promise<Category[]> {
  const rows = await db
    .select()
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.sortOrder));
  return rows.map(toCategory);
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  const rows = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slug))
    .limit(1);
  return rows[0] ? toCategory(rows[0]) : undefined;
}

export async function getProductsByCategory(
  categoryId: string,
  categorySlug: string
): Promise<Product[]> {
  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.categoryId, categoryId))
    .orderBy(asc(productsTable.name));
  return rows.map((r) => toProduct(r, categorySlug));
}

export async function getProduct(
  categorySlug: string,
  productSlug: string
): Promise<Product | undefined> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return undefined;
  const rows = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.categoryId, category.id),
        eq(productsTable.slug, productSlug)
      )
    )
    .limit(1);
  return rows[0] ? toProduct(rows[0], categorySlug) : undefined;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const rows = await db
    .select({
      product: productsTable,
      categorySlug: categoriesTable.slug,
    })
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id)
    )
    .where(eq(productsTable.isFeatured, true));
  return rows.map((r) => toProduct(r.product, r.categorySlug));
}

export async function getRelatedProducts(product: Product): Promise<Product[]> {
  const rows = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.categoryId, product.categoryId),
        ne(productsTable.id, product.id)
      )
    )
    .orderBy(asc(productsTable.name));
  return rows.map((r) => toProduct(r, product.categorySlug));
}
