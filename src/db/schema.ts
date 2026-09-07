import {
  pgTable,
  text,
  integer,
  doublePrecision,
  boolean,
  jsonb,
  timestamp,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const pricingModeEnum = pgEnum("pricing_mode", [
  "per_metre",
  "fixed",
  "on_request",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "new",
  "contacted",
  "measured",
  "in_production",
  "ready_delivered",
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isPlaceholder: boolean("is_placeholder").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  filterKind: text("filter_kind", {
    enum: ["kitchen", "collection", "none"],
  })
    .notNull()
    .default("none"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  specLine: text("spec_line").notNull().default(""),
  description: text("description").notNull().default(""),
  pricingMode: pricingModeEnum("pricing_mode").notNull().default("on_request"),
  pricePerMetre: integer("price_per_metre"),
  hardwareOptions: jsonb("hardware_options").$type<HardwareOption[]>(),
  colourOptions: jsonb("colour_options").$type<ColourOption[]>(),
  collection: text("collection"),
  attributes: jsonb("attributes").$type<ProductAttribute[]>().notNull().default([]),
  isSample: boolean("is_sample").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export interface StatusHistoryEntry {
  status: string;
  changedAt: string;
}

export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  notes: text("notes").notNull().default(""),
  status: requestStatusEnum("status").notNull().default("new"),
  statusHistory: jsonb("status_history")
    .$type<StatusHistoryEntry[]>()
    .notNull()
    .default([]),
  assignedManager: text("assigned_manager"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const requestItems = pgTable("request_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: text("product_name").notNull(),
  categorySlug: text("category_slug").notNull(),
  productSlug: text("product_slug").notNull(),
  hardwareLabel: text("hardware_label"),
  colourLabel: text("colour_label"),
  widthMetres: doublePrecision("width_metres"),
  estimate: integer("estimate"),
});
