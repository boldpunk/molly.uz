"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { BRAND_SLOTS, type BrandSlot } from "./brand";

function isBrandSlot(value: string): value is BrandSlot {
  return (BRAND_SLOTS as readonly string[]).includes(value);
}

// Only paths this app serves are accepted: an absolute URL here would put a
// third party in control of the logo on every page.
function sanitizeAssetPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

export async function saveBrandAsset(slot: string, formData: FormData) {
  if (!isBrandSlot(slot)) return;

  const raw = formData.get("url");
  const value = sanitizeAssetPath(typeof raw === "string" ? raw : "");
  if (value === null) return;

  await db
    .insert(siteSettings)
    .values({ key: slot, value })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    });

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

export async function resetBrandAsset(slot: string) {
  await saveBrandAsset(slot, new FormData());
}
