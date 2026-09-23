import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

// Slots an administrator can override under /admin/brand. Each falls back to
// the built-in wordmark when empty, so the site always has a logo.
export const BRAND_SLOTS = [
  "logo_primary",
  "logo_reversed",
  "logo_square",
] as const;

export type BrandSlot = (typeof BRAND_SLOTS)[number];

export interface BrandAssets {
  /** Navy wordmark, for light and cream grounds. */
  primary: string | null;
  /** Cream wordmark, for navy and dark photography. */
  reversed: string | null;
  /** Square lockup for avatars and social profiles. */
  square: string | null;
}

const SLOT_TO_FIELD: Record<BrandSlot, keyof BrandAssets> = {
  logo_primary: "primary",
  logo_reversed: "reversed",
  logo_square: "square",
};

export const BRAND_SLOT_LABELS: Record<BrandSlot, string> = {
  logo_primary: "Основной логотип",
  logo_reversed: "Инверсный логотип",
  logo_square: "Квадратный логотип",
};

export const BRAND_SLOT_HINTS: Record<BrandSlot, string> = {
  logo_primary:
    "Тёмно-синий на светлом фоне. Шапка сайта, подвал, панель управления, КП.",
  logo_reversed:
    "Кремовый на тёмно-синем. Для тёмных фонов и фотографий.",
  logo_square:
    "Квадратная версия: аватарки, соцсети, иконка приложения.",
};

export const BRAND_FALLBACKS: Record<BrandSlot, string> = {
  logo_primary: "/brand/molly-home-logo.svg",
  logo_reversed: "/brand/molly-home-logo-cream.svg",
  logo_square: "/brand/molly-home-logo-square.svg",
};

export async function getBrandAssets(): Promise<BrandAssets> {
  const assets: BrandAssets = { primary: null, reversed: null, square: null };
  try {
    const rows = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, [...BRAND_SLOTS]));
    for (const row of rows) {
      const field = SLOT_TO_FIELD[row.key as BrandSlot];
      if (field && row.value) assets[field] = row.value;
    }
  } catch {
    // A missing settings table must never take the site down — the built-in
    // wordmark covers every slot.
  }
  return assets;
}
