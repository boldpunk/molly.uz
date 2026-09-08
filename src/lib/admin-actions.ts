"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, products, requests, pages } from "@/db/schema";
import type {
  HardwareOption,
  ColourOption,
  ProductAttribute,
  StatusHistoryEntry,
  PageBlock,
} from "@/db/schema";
import { RequestStatus } from "./types";
import { deleteProductImage } from "./upload-actions";

function parseJsonArray<T>(raw: FormDataEntryValue | null): T[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// --- Categories ---------------------------------------------------------

export async function createCategory(formData: FormData) {
  await db.insert(categories).values({
    name: String(formData.get("name")),
    slug: String(formData.get("slug")),
    isPlaceholder: formData.get("isPlaceholder") === "on",
    sortOrder: Number(formData.get("sortOrder")) || 0,
    filterKind: String(formData.get("filterKind")) as
      | "kitchen"
      | "collection"
      | "none",
  });
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await db
    .update(categories)
    .set({
      name: String(formData.get("name")),
      slug: String(formData.get("slug")),
      isPlaceholder: formData.get("isPlaceholder") === "on",
      sortOrder: Number(formData.get("sortOrder")) || 0,
      filterKind: String(formData.get("filterKind")) as
        | "kitchen"
        | "collection"
        | "none",
    })
    .where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

// --- Products ------------------------------------------------------------

function productValuesFromFormData(formData: FormData) {
  const pricingMode = String(formData.get("pricingMode")) as
    | "per_metre"
    | "fixed"
    | "on_request";

  const hardwareOptions = parseJsonArray<HardwareOption>(
    formData.get("hardwareOptionsJson")
  );
  const colourOptions = parseJsonArray<ColourOption>(
    formData.get("colourOptionsJson")
  );
  const attributes = parseJsonArray<ProductAttribute>(
    formData.get("attributesJson")
  );
  const galleryUrls = parseJsonArray<string>(formData.get("galleryUrlsJson"));

  return {
    categoryId: String(formData.get("categoryId")),
    slug: String(formData.get("slug")),
    name: String(formData.get("name")),
    specLine: String(formData.get("specLine") ?? ""),
    description: String(formData.get("description") ?? ""),
    pricingMode,
    hardwareOptions: hardwareOptions.length > 0 ? hardwareOptions : null,
    colourOptions: colourOptions.length > 0 ? colourOptions : null,
    collection: String(formData.get("collection") ?? "") || null,
    attributes,
    isSample: formData.get("isSample") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    imageUrl: String(formData.get("imageUrl") ?? "") || null,
    galleryUrls,
    metaTitle: String(formData.get("metaTitle") ?? "") || null,
    metaDescription: String(formData.get("metaDescription") ?? "") || null,
    updatedAt: new Date(),
  };
}

export async function createProduct(formData: FormData) {
  await db.insert(products).values(productValuesFromFormData(formData));
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const [existing] = await db
    .select({ imageUrl: products.imageUrl, galleryUrls: products.galleryUrls })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  const values = productValuesFromFormData(formData);
  await db.update(products).set(values).where(eq(products.id, id));

  if (existing?.imageUrl && existing.imageUrl !== values.imageUrl) {
    await deleteProductImage(existing.imageUrl);
  }
  const removedGalleryUrls = (existing?.galleryUrls ?? []).filter(
    (url) => !values.galleryUrls.includes(url)
  );
  await Promise.all(removedGalleryUrls.map((url) => deleteProductImage(url)));

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const [existing] = await db
    .select({ imageUrl: products.imageUrl, galleryUrls: products.galleryUrls })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  await db.delete(products).where(eq(products.id, id));

  if (existing?.imageUrl) {
    await deleteProductImage(existing.imageUrl);
  }
  await Promise.all(
    (existing?.galleryUrls ?? []).map((url) => deleteProductImage(url))
  );

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

// --- Requests (Section 7.2 pipeline) --------------------------------------

export async function updateRequest(id: string, formData: FormData) {
  const status = String(formData.get("status")) as RequestStatus;
  const notes = String(formData.get("notes") ?? "");
  const assignedManager = String(formData.get("assignedManager") ?? "") || null;

  const [current] = await db
    .select({ status: requests.status, statusHistory: requests.statusHistory })
    .from(requests)
    .where(eq(requests.id, id))
    .limit(1);

  const statusHistory: StatusHistoryEntry[] = current?.statusHistory ?? [];
  const statusChanged = current && current.status !== status;
  const nextHistory = statusChanged
    ? [...statusHistory, { status, changedAt: new Date().toISOString() }]
    : statusHistory;

  await db
    .update(requests)
    .set({
      status,
      notes,
      assignedManager,
      statusHistory: nextHistory,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, id));

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin");
}

export async function deleteRequest(id: string) {
  await db.delete(requests).where(eq(requests.id, id));
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  redirect("/admin/requests");
}

// --- Pages (content blocks) -----------------------------------------------

export async function updatePage(slug: string, formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const blocks = parseJsonArray<PageBlock>(formData.get("blocksJson"));
  const metaTitle = String(formData.get("metaTitle") ?? "") || null;
  const metaDescription = String(formData.get("metaDescription") ?? "") || null;

  await db
    .update(pages)
    .set({ title, blocks, metaTitle, metaDescription, updatedAt: new Date() })
    .where(eq(pages.slug, slug));

  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${slug}`);
  revalidatePath(slug === "home" ? "/" : `/${slug}`);
  redirect("/admin/pages");
}
