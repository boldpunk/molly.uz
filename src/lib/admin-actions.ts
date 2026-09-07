"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, products, requests } from "@/db/schema";
import type {
  HardwareOption,
  ColourOption,
  ProductAttribute,
  StatusHistoryEntry,
} from "@/db/schema";
import { RequestStatus } from "./types";

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
  await db
    .update(products)
    .set(productValuesFromFormData(formData))
    .where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
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
