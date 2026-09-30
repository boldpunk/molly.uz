import { eq, and, ne, asc, desc, or, ilike } from "drizzle-orm";
import { db } from "@/db";
import {
  categories as categoriesTable,
  products as productsTable,
  pages as pagesTable,
  favourites as favouritesTable,
  wardrobeFinishes as wardrobeFinishesTable,
  employees as employeesTable,
  employeeApplications as employeeApplicationsTable,
} from "@/db/schema";
import type { PageBlock } from "@/db/schema";
import { Category, Product } from "./types";
import { cached } from "./data-cache";

const DEFAULT_CONTACT_INFO: Extract<PageBlock, { type: "contact_info" }> = {
  type: "contact_info",
  phone: "+998 94 608 50 05",
  email: "info@molly.uz",
  hours: "Пн–Сб: 09:00–19:00 · Вс: выходной",
  telegram: "mollyhomeuzbot",
  instagram: "molly_home.uz",
  address: "Ташкент, ул. Янги Олмазор, 17/23",
  addressNote: "Работаем по всему Ташкенту и области — выезд замерщика бесплатный.",
  mapLat: 41.350703,
  mapLng: 69.245558,
};

export async function getContactInfo(): Promise<
  Extract<PageBlock, { type: "contact_info" }>
> {
  const page = await getPageBySlug("contacts");
  const block = page?.blocks?.[2];
  return block?.type === "contact_info" ? block : DEFAULT_CONTACT_INFO;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  blocks: import("@/db/schema").PageBlock[];
  metaTitle: string | null;
  metaDescription: string | null;
}

async function loadPageBySlug(slug: string): Promise<Page | undefined> {
  const rows = await db
    .select()
    .from(pagesTable)
    .where(eq(pagesTable.slug, slug))
    .limit(1);
  return rows[0];
}

export async function getAllPages(): Promise<Page[]> {
  return db.select().from(pagesTable).orderBy(asc(pagesTable.slug));
}

function toCategory(row: typeof categoriesTable.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isPlaceholder: row.isPlaceholder,
    imageUrl: row.imageUrl ?? undefined,
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
    basePrice: row.basePrice ?? undefined,
    discountPercent: row.discountPercent ?? undefined,
    hardwareOptions: row.hardwareOptions ?? undefined,
    colourOptions: row.colourOptions ?? undefined,
    collection: row.collection ?? undefined,
    attributes: row.attributes,
    isSample: row.isSample,
    isFeatured: row.isFeatured,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    imageUrl: row.imageUrl ?? undefined,
    galleryUrls: row.galleryUrls,
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
  };
}

async function loadCategories(): Promise<Category[]> {
  const rows = await db
    .select()
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.sortOrder));
  return rows.map(toCategory);
}

export interface WardrobeFinish {
  id: string;
  label: string;
  ral: string | null;
  hex: string;
}

async function loadWardrobeFinishes(): Promise<WardrobeFinish[]> {
  const rows = await db
    .select()
    .from(wardrobeFinishesTable)
    .orderBy(asc(wardrobeFinishesTable.sortOrder));
  return rows.map((r) => ({ id: r.id, label: r.label, ral: r.ral, hex: r.hex }));
}

export interface Employee {
  id: string;
  telegramId: string;
  name: string;
  createdAt: Date;
}

export interface EmployeeApplication {
  id: string;
  telegramId: string;
  name: string;
  createdAt: Date;
}

export async function getEmployees(): Promise<Employee[]> {
  return db
    .select()
    .from(employeesTable)
    .orderBy(desc(employeesTable.createdAt));
}

export async function getEmployeeApplications(): Promise<EmployeeApplication[]> {
  return db
    .select()
    .from(employeeApplicationsTable)
    .orderBy(desc(employeeApplicationsTable.createdAt));
}

async function loadCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  const rows = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slug))
    .limit(1);
  return rows[0] ? toCategory(rows[0]) : undefined;
}

async function loadProductsByCategory(
  categoryId: string,
  categorySlug: string
): Promise<Product[]> {
  const rows = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.categoryId, categoryId), eq(productsTable.isPublished, true)))
    .orderBy(asc(productsTable.name));
  return rows.map((r) => toProduct(r, categorySlug));
}

async function loadProduct(
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
        eq(productsTable.slug, productSlug),
        eq(productsTable.isPublished, true)
      )
    )
    .limit(1);
  return rows[0] ? toProduct(rows[0], categorySlug) : undefined;
}

async function loadProductById(id: string): Promise<Product | undefined> {
  const rows = await db
    .select({ product: productsTable, categorySlug: categoriesTable.slug })
    .from(productsTable)
    .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id))
    .limit(1);
  return rows[0] ? toProduct(rows[0].product, rows[0].categorySlug) : undefined;
}

async function loadFeaturedProducts(): Promise<Product[]> {
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
    .where(and(eq(productsTable.isFeatured, true), eq(productsTable.isPublished, true)));
  return rows.map((r) => toProduct(r.product, r.categorySlug));
}

/** Published products for the site; the admin passes true to see all. */
async function loadAllProducts(includeHidden = false): Promise<Product[]> {
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
    .where(includeHidden ? undefined : eq(productsTable.isPublished, true))
    .orderBy(asc(categoriesTable.sortOrder), asc(productsTable.name));
  return rows.map((r) => toProduct(r.product, r.categorySlug));
}

export async function searchProducts(query: string): Promise<Product[]> {
  const term = query.trim();
  if (!term) return [];
  const pattern = `%${term}%`;
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
    .where(
      and(
        eq(productsTable.isPublished, true),
        or(
        ilike(productsTable.name, pattern),
        ilike(productsTable.specLine, pattern),
        ilike(productsTable.description, pattern),
        ilike(productsTable.collection, pattern),
        ilike(categoriesTable.name, pattern)
        )
      )
    )
    .orderBy(asc(productsTable.name));
  return rows.map((r) => toProduct(r.product, r.categorySlug));
}

async function loadRelatedProducts(product: Product): Promise<Product[]> {
  const rows = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.categoryId, product.categoryId),
        ne(productsTable.id, product.id),
        eq(productsTable.isPublished, true)
      )
    )
    .orderBy(asc(productsTable.name));
  return rows.map((r) => toProduct(r, product.categorySlug));
}

export async function isFavourite(
  customerId: string,
  productId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: favouritesTable.id })
    .from(favouritesTable)
    .where(
      and(
        eq(favouritesTable.customerId, customerId),
        eq(favouritesTable.productId, productId)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function getFavouriteProducts(
  customerId: string
): Promise<Product[]> {
  const rows = await db
    .select({
      product: productsTable,
      categorySlug: categoriesTable.slug,
    })
    .from(favouritesTable)
    .innerJoin(productsTable, eq(favouritesTable.productId, productsTable.id))
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id)
    )
    .where(eq(favouritesTable.customerId, customerId))
    .orderBy(desc(favouritesTable.createdAt));
  return rows.map((r) => toProduct(r.product, r.categorySlug));
}

// Storefront reads are served from memory; see lib/data-cache.ts.
export const getPageBySlug = cached("getPageBySlug", loadPageBySlug);
export const getCategories = cached("getCategories", loadCategories);
export const getWardrobeFinishes = cached("getWardrobeFinishes", loadWardrobeFinishes);
export const getCategoryBySlug = cached("getCategoryBySlug", loadCategoryBySlug);
export const getProductsByCategory = cached("getProductsByCategory", loadProductsByCategory);
export const getProduct = cached("getProduct", loadProduct);
export const getProductById = cached("getProductById", loadProductById);
export const getFeaturedProducts = cached("getFeaturedProducts", loadFeaturedProducts);
export const getAllProducts = cached("getAllProducts", loadAllProducts);
export const getRelatedProducts = cached("getRelatedProducts", loadRelatedProducts);
