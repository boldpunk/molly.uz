// Brand configuration with no database imports, so client components can
// read slot names, labels and the logo scale bounds safely.

// Slots an administrator can override under /admin/brand. Each falls back to
// the built-in wordmark when empty, so the site always has a logo.
export const BRAND_SLOTS = [
  "logo_primary",
  "logo_reversed",
  "logo_square",
] as const;

export type BrandSlot = (typeof BRAND_SLOTS)[number];

export const LOGO_SCALE_KEY = "logo_scale";

export const LOGO_SCALE_MIN = 50;
export const LOGO_SCALE_MAX = 150;
export const LOGO_SCALE_DEFAULT = 100;

export function clampLogoScale(value: number): number {
  if (!Number.isFinite(value)) return LOGO_SCALE_DEFAULT;
  return Math.min(LOGO_SCALE_MAX, Math.max(LOGO_SCALE_MIN, Math.round(value)));
}

