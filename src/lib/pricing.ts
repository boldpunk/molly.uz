import { Product } from "@/lib/types";

export function applyDiscount(price: number, discountPercent?: number | null): number {
  if (!discountPercent) return price;
  return Math.round(price * (1 - discountPercent / 100));
}

export interface DisplayPrice {
  /** Price to show as the main figure (discounted if a discount is set). */
  amount: number;
  /** Pre-discount price, present only when a discount applies. */
  originalAmount?: number;
  discountPercent?: number;
}

/**
 * The price a product card/PDP should lead with, for pricing modes that
 * have one price to show ("fixed" — a flat price, "per_metre" — the
 * cheapest hardware option, used as a "от" starting price).
 * Returns null for "on_request" products, which have no price to discount.
 */
export function getDisplayPrice(product: Product): DisplayPrice | null {
  const discountPercent =
    product.discountPercent && product.discountPercent > 0
      ? product.discountPercent
      : undefined;

  if (product.pricingMode === "fixed" && product.basePrice) {
    return {
      amount: applyDiscount(product.basePrice, discountPercent),
      originalAmount: discountPercent ? product.basePrice : undefined,
      discountPercent,
    };
  }

  if (product.pricingMode === "per_metre" && product.hardwareOptions?.length) {
    const minPrice = Math.min(
      ...product.hardwareOptions.map((h) => h.pricePerMetre)
    );
    return {
      amount: applyDiscount(minPrice, discountPercent),
      originalAmount: discountPercent ? minPrice : undefined,
      discountPercent,
    };
  }

  return null;
}
