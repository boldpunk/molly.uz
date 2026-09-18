"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  categories,
  products,
  requests,
  requestItems,
  pages,
  wardrobeFinishes,
} from "@/db/schema";
import type {
  HardwareOption,
  ColourOption,
  ProductAttribute,
  PageBlock,
  StatusHistoryEntry,
} from "@/db/schema";
import { deleteProductImage } from "./upload-actions";
import { postNewOrderCard } from "./order-bot";
import { getCurrentAdmin } from "./admin-users";
import {
  deleteTelegramMessage,
  getStaffChatId,
  isStaffNotifyConfigured,
} from "./telegram";

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

  const basePriceRaw = String(formData.get("basePrice") ?? "").trim();
  const discountPercentRaw = String(formData.get("discountPercent") ?? "").trim();

  return {
    categoryId: String(formData.get("categoryId")),
    slug: String(formData.get("slug")),
    name: String(formData.get("name")),
    specLine: String(formData.get("specLine") ?? ""),
    description: String(formData.get("description") ?? ""),
    pricingMode,
    basePrice: basePriceRaw ? Math.round(Number(basePriceRaw)) : null,
    discountPercent: discountPercentRaw ? Math.round(Number(discountPercentRaw)) : null,
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

// Duplicated products can share imageUrl/galleryUrls with the product they
// were copied from, so a file must only be deleted once nothing else
// references it — otherwise editing/deleting one duplicate would knock out
// the photo on another product still using the same file.
async function deleteProductImageIfUnreferenced(url: string, excludeProductId: string) {
  const rows = await db
    .select({ imageUrl: products.imageUrl, galleryUrls: products.galleryUrls })
    .from(products)
    .where(ne(products.id, excludeProductId));
  const stillReferenced = rows.some(
    (r) => r.imageUrl === url || r.galleryUrls.includes(url)
  );
  if (!stillReferenced) {
    await deleteProductImage(url);
  }
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
    await deleteProductImageIfUnreferenced(existing.imageUrl, id);
  }
  const removedGalleryUrls = (existing?.galleryUrls ?? []).filter(
    (url) => !values.galleryUrls.includes(url)
  );
  await Promise.all(
    removedGalleryUrls.map((url) => deleteProductImageIfUnreferenced(url, id))
  );

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function duplicateProduct(id: string) {
  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!existing) throw new Error("Товар не найден");

  let slug = `${existing.slug}-copy`;
  let suffix = 2;
  while (
    (
      await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.categoryId, existing.categoryId), eq(products.slug, slug)))
        .limit(1)
    ).length > 0
  ) {
    slug = `${existing.slug}-copy-${suffix}`;
    suffix += 1;
  }

  await db.insert(products).values({
    categoryId: existing.categoryId,
    slug,
    name: `${existing.name} (копия)`,
    specLine: existing.specLine,
    description: existing.description,
    imageUrl: existing.imageUrl,
    galleryUrls: existing.galleryUrls,
    pricingMode: existing.pricingMode,
    basePrice: existing.basePrice,
    discountPercent: existing.discountPercent,
    hardwareOptions: existing.hardwareOptions,
    colourOptions: existing.colourOptions,
    collection: existing.collection,
    attributes: existing.attributes,
    isSample: existing.isSample,
    isFeatured: false,
  });

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
    await deleteProductImageIfUnreferenced(existing.imageUrl, id);
  }
  await Promise.all(
    (existing?.galleryUrls ?? []).map((url) => deleteProductImageIfUnreferenced(url, id))
  );

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

// --- Requests (MebelFlow order funnel — status is driven by the Telegram
// bot; the admin panel can only edit notes) --------------------------------

export async function createManualOrder(formData: FormData) {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim() || "Ручной ввод";
  const notes = String(formData.get("notes") ?? "").trim();
  const productIds = parseJsonArray<string>(formData.get("productIdsJson")).filter(
    (id) => typeof id === "string" && id.length > 0
  );

  if (!customerName || !customerPhone) {
    throw new Error("Имя клиента и телефон обязательны");
  }

  const admin = await getCurrentAdmin();
  const historyEntry: StatusHistoryEntry = {
    status: "new_order",
    changedAt: new Date().toISOString(),
    employeeName: admin ? `${admin.name} (админ-панель)` : "Админ-панель",
    note: "Создано вручную в админ-панели",
  };

  const [created] = await db
    .insert(requests)
    .values({
      customerName,
      customerPhone,
      source,
      notes,
      statusHistory: [historyEntry],
    })
    .returning({ id: requests.id });

  if (productIds.length > 0) {
    const pickedProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(inArray(products.id, productIds));

    if (pickedProducts.length > 0) {
      await db.insert(requestItems).values(
        pickedProducts.map((p) => ({
          requestId: created.id,
          productId: p.id,
          productName: p.name,
          categorySlug: p.categorySlug,
          productSlug: p.slug,
        }))
      );
    }
  }

  await postNewOrderCard(created.id).catch((err) =>
    console.error("Telegram order card post failed", err)
  );

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  redirect(`/admin/requests/${created.id}`);
}

export async function updateRequest(id: string, formData: FormData) {
  const notes = String(formData.get("notes") ?? "");

  await db
    .update(requests)
    .set({ notes, updatedAt: new Date() })
    .where(eq(requests.id, id));

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin");
}

export async function deleteRequest(id: string) {
  if (isStaffNotifyConfigured()) {
    const [current] = await db
      .select({ telegramMessageId: requests.telegramMessageId })
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);
    if (current?.telegramMessageId) {
      await deleteTelegramMessage(getStaffChatId()!, current.telegramMessageId).catch(
        (err) => console.error("Telegram message delete failed", err)
      );
    }
  }

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

// --- Wardrobe configurator -------------------------------------------------

interface WardrobeFinishInput {
  label: string;
  ral: string;
  hex: string;
}

export async function updateWardrobeFinishes(formData: FormData) {
  const items = parseJsonArray<WardrobeFinishInput>(
    formData.get("finishesJson")
  )
    .map((f) => ({
      label: f.label.trim(),
      ral: f.ral.trim() || null,
      hex: f.hex.trim(),
    }))
    .filter((f) => f.label && /^#[0-9a-fA-F]{6}$/.test(f.hex));

  // neon-http has no transaction support, so this is delete-then-insert
  // rather than atomic — acceptable for a low-traffic admin config list.
  await db.delete(wardrobeFinishes);
  if (items.length > 0) {
    await db.insert(wardrobeFinishes).values(
      items.map((f, i) => ({ ...f, sortOrder: i }))
    );
  }

  revalidatePath("/admin/configurator");
  revalidatePath("/configurator/shkaf");
  redirect("/admin/configurator");
}
