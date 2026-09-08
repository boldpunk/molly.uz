export type PricingMode = "per_metre" | "fixed" | "on_request";

export interface HardwareOption {
  id: string;
  label: string;
  pricePerMetre: number;
}

export interface ColourOption {
  id: string;
  label: string;
  swatch: string;
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  isPlaceholder: boolean;
  sortOrder: number;
  filterKind: "kitchen" | "collection" | "none";
}

export interface Product {
  id: string;
  categoryId: string;
  categorySlug: string;
  slug: string;
  name: string;
  specLine: string;
  description: string;
  pricingMode: PricingMode;
  pricePerMetre?: number;
  hardwareOptions?: HardwareOption[];
  colourOptions?: ColourOption[];
  collection?: string;
  attributes: ProductAttribute[];
  isSample: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
}

export interface RequestItem {
  productId: string;
  productName: string;
  categorySlug: string;
  productSlug: string;
  hardwareId?: string;
  hardwareLabel?: string;
  colourId?: string;
  colourLabel?: string;
  widthMetres?: number;
  estimate?: number;
}

export const REQUEST_STATUSES = [
  "new",
  "contacted",
  "measured",
  "in_production",
  "ready_delivered",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  new: "Новая заявка",
  contacted: "Связались",
  measured: "Замер выполнен",
  in_production: "В производстве",
  ready_delivered: "Готово / доставлено",
};
