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
  unique,
} from "drizzle-orm/pg-core";

export const pricingModeEnum = pgEnum("pricing_mode", [
  "per_metre",
  "fixed",
  "on_request",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "new_order",
  "contacted",
  "meeting_scheduled",
  "meeting_done",
  "purchase_request",
  "deposit_received",
  "paid_full",
  "in_production",
  "ready_shipment",
]);

export const adminRoleEnum = pgEnum("admin_role", [
  "administrator",
  "content_editor",
  "catalog_manager",
  "sales_manager",
]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: adminRoleEnum("role").notNull().default("administrator"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
  imageUrl: text("image_url"),
  galleryUrls: jsonb("gallery_urls").$type<string[]>().notNull().default([]),
  pricingMode: pricingModeEnum("pricing_mode").notNull().default("on_request"),
  pricePerMetre: integer("price_per_metre"),
  hardwareOptions: jsonb("hardware_options").$type<HardwareOption[]>(),
  colourOptions: jsonb("colour_options").$type<ColourOption[]>(),
  collection: text("collection"),
  attributes: jsonb("attributes").$type<ProductAttribute[]>().notNull().default([]),
  isSample: boolean("is_sample").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PageBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; alt: string }
  | { type: "stat_list"; items: { label: string; value: string; icon?: string }[] }
  | { type: "cta"; label: string; href: string }
  | { type: "brand_list"; items: { name: string; logoUrl: string }[] }
  | { type: "instagram_strip"; urls: string[] }
  | {
      type: "contact_info";
      phone: string;
      email: string;
      hours: string;
      telegram: string;
      instagram: string;
      address: string;
      addressNote: string;
      mapLat: number;
      mapLng: number;
    };

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  blocks: jsonb("blocks").$type<PageBlock[]>().notNull().default([]),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  telegramId: text("telegram_id").unique(),
  telegramNotifyOptIn: boolean("telegram_notify_opt_in").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const favourites = pgTable(
  "favourites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.customerId, table.productId)]
);

export interface StatusHistoryEntry {
  status: string;
  changedAt: string;
  employeeTelegramId?: string;
  employeeName?: string;
  amount?: number;
  note?: string;
}

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramId: text("telegram_id").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderCounters = pgTable("order_counters", {
  year: integer("year").primaryKey(),
  seq: integer("seq").notNull().default(0),
});

export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  notes: text("notes").notNull().default(""),
  source: text("source").notNull().default("Сайт"),
  status: requestStatusEnum("status").notNull().default("new_order"),
  statusHistory: jsonb("status_history")
    .$type<StatusHistoryEntry[]>()
    .notNull()
    .default([]),
  orderNumber: text("order_number").unique(),
  assignedManagerId: uuid("assigned_manager_id").references(() => employees.id, {
    onDelete: "set null",
  }),
  totalAmount: integer("total_amount"),
  depositAmount: integer("deposit_amount"),
  paidAmount: integer("paid_amount"),
  paidAt: timestamp("paid_at"),
  productionStartedAt: timestamp("production_started_at"),
  telegramMessageId: text("telegram_message_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const telegramPendingActions = pgTable("telegram_pending_actions", {
  key: text("key").primaryKey(),
  kind: text("kind", {
    enum: ["register_name", "amount_deposit", "amount_paid_full"],
  }).notNull(),
  requestId: uuid("request_id").references(() => requests.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
