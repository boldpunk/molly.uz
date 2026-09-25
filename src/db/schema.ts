import {
  pgTable,
  text,
  integer,
  bigint,
  date,
  doublePrecision,
  boolean,
  jsonb,
  timestamp,
  uuid,
  pgEnum,
  unique,
  index,
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
  imageUrl?: string;
  galleryUrls?: string[];
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
  // Base price for "fixed"-mode products (ready-made items sold at one
  // price, e.g. sofas) — pre-discount. Column kept as price_per_metre at
  // the DB level (was added but never wired up under that name) to avoid
  // an interactive drizzle-kit rename prompt; base_price is just its
  // application-facing name.
  basePrice: integer("price_per_metre"),
  discountPercent: integer("discount_percent"),
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
}, (table) => [
  index("products_category_name_idx").on(table.categoryId, table.name),
  index("products_featured_idx").on(table.isFeatured),
]);

export type PageBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; alt: string }
  | { type: "stat_list"; items: { label: string; value: string; icon?: string }[] }
  | { type: "cta"; label: string; href: string }
  | { type: "brand_list"; items: { name: string; logoUrl: string }[] }
  | {
      type: "reviews";
      items: { name: string; role?: string; rating: number; text: string }[];
    }
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
  (table) => [
    unique().on(table.customerId, table.productId),
    index("favourites_customer_idx").on(table.customerId),
  ]
);

export interface StatusHistoryEntry {
  status: string;
  changedAt: string;
  employeeTelegramId?: string;
  employeeName?: string;
  amount?: number;
  note?: string;
}

// Telegram can redeliver the same update (retries after a slow/failed
// response, or after a webhook outage) — this dedupes so a redelivered
// update never re-runs handleMessage/handleCallbackQuery a second time.
export const telegramProcessedUpdates = pgTable("telegram_processed_updates", {
  updateId: text("update_id").primaryKey(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
}, (table) => [
  index("telegram_processed_updates_processed_at_idx").on(table.processedAt),
]);

export const wardrobeFinishes = pgTable("wardrobe_finishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  ral: text("ral"),
  hex: text("hex").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramId: text("telegram_id").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// A private-chat "Я менеджер" tap used to insert straight into `employees`,
// which also grants the new-order DM broadcast — meaning anyone could grant
// themselves access to every future customer's name/phone/comment. This
// queues the request instead; only an administrator moving it into
// `employees` from /admin/employees grants that access.
export const employeeApplications = pgTable("employee_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramId: text("telegram_id").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Brand assets an administrator can swap without a deploy. Empty or missing
// rows mean "use the built-in wordmark from the brand book", so the site is
// never left without a logo.
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderCounters = pgTable("order_counters", {
  year: integer("year").primaryKey(),
  seq: integer("seq").notNull().default(0),
});

// Client<->manager dialogs (§3 "Общение с менеджером" / §4 "Диалоги").
// Kept as its own thread, not folded into `requests`, so a plain question
// doesn't create a fake lead in the sales pipeline.
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerTelegramId: text("customer_telegram_id").notNull(),
  customerName: text("customer_name").notNull(),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
}, (table) => [
  index("conversations_status_updated_idx").on(table.status, table.updatedAt),
  index("conversations_customer_idx").on(table.customerTelegramId, table.status),
]);

export const conversationMessages = pgTable("conversation_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  direction: text("direction", { enum: ["from_customer", "from_staff"] }).notNull(),
  authorName: text("author_name"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("conversation_messages_conversation_idx").on(
    table.conversationId,
    table.createdAt
  ),
]);

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
}, (table) => [
  index("requests_created_at_idx").on(table.createdAt),
  index("requests_status_created_at_idx").on(table.status, table.createdAt),
  index("requests_customer_idx").on(table.customerId),
  index("requests_assigned_manager_idx").on(table.assignedManagerId),
]);

export const telegramPendingActions = pgTable("telegram_pending_actions", {
  key: text("key").primaryKey(),
  kind: text("kind", {
    enum: [
      "register_name",
      "amount_deposit",
      "amount_paid_full",
      "new_order_entry",
      "product_question",
      "conversation_reply",
    ],
  }).notNull(),
  requestId: uuid("request_id").references(() => requests.id, {
    onDelete: "cascade",
  }),
  // Opaque per-kind data that doesn't fit requestId — product_question
  // stores the product id, conversation_reply stores the conversation id.
  payload: text("payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("telegram_pending_actions_request_idx").on(table.requestId),
]);

export interface ProposalBrand {
  name: string;
  logoUrl?: string;
}

// Commercial proposals (КП). Money is stored in minor units (tiyin/cents) and
// quantities in thousandths, both as integers — a proposal is a priced
// document a customer is shown, so no line total may ever drift by a float
// rounding error. See src/lib/proposal-money.ts for the conversions.
export const commercialProposals = pgTable("commercial_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").notNull().unique(),
  proposalDate: date("proposal_date").notNull(),
  // Linked account when the client has one; the snapshot fields below are
  // still always filled, so editing a customer later never rewrites a
  // proposal that was already sent (§30 historical pricing, same reasoning).
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  clientName: text("client_name").notNull().default(""),
  clientPhone: text("client_phone").notNull().default(""),
  clientCompany: text("client_company").notNull().default(""),
  clientAddress: text("client_address").notNull().default(""),
  projectName: text("project_name").notNull().default(""),
  language: text("language", { enum: ["ru", "uz"] })
    .notNull()
    .default("ru"),
  currency: text("currency", { enum: ["UZS", "USD", "EUR"] })
    .notNull()
    .default("UZS"),
  themeColor: text("theme_color").notNull().default("#C08A2E"),
  preparedById: uuid("prepared_by_id").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  preparedByName: text("prepared_by_name").notNull().default(""),
  preparedByPhone: text("prepared_by_phone").notNull().default(""),
  deadline: text("deadline").notNull().default(""),
  // Snapshot of the brands picked from the site's brand directory, for the
  // same reason as the client fields.
  brands: jsonb("brands").$type<ProposalBrand[]>().notNull().default([]),
  subtotalMinor: bigint("subtotal_minor", { mode: "number" })
    .notNull()
    .default(0),
  totalMinor: bigint("total_minor", { mode: "number" }).notNull().default(0),
  finalText: text("final_text").notNull().default(""),
  validityNote: text("validity_note").notNull().default(""),
  status: text("status", {
    enum: ["draft", "ready", "sent", "accepted", "rejected", "archived"],
  })
    .notNull()
    .default("draft"),
  sourceRequestId: uuid("source_request_id").references(() => requests.id, {
    onDelete: "set null",
  }),
  createdById: uuid("created_by_id").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("commercial_proposals_created_at_idx").on(table.createdAt),
  index("commercial_proposals_source_request_idx").on(table.sourceRequestId),
]);

export const commercialProposalItems = pgTable("commercial_proposal_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => commercialProposals.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  name: text("name").notNull().default(""),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  quantityMilli: integer("quantity_milli").notNull().default(1000),
  unit: text("unit", {
    enum: ["pcs", "rm", "m2", "m", "set", "service"],
  })
    .notNull()
    .default("pcs"),
  dimensions: text("dimensions").notNull().default(""),
  unitPriceMinor: bigint("unit_price_minor", { mode: "number" })
    .notNull()
    .default(0),
  totalMinor: bigint("total_minor", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const proposalTextTemplates = pgTable("proposal_text_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  language: text("language", { enum: ["ru", "uz"] })
    .notNull()
    .default("ru"),
  text: text("text").notNull(),
  active: boolean("active").notNull().default(true),
  createdById: uuid("created_by_id").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Single-row counter behind the MH-0001 proposal numbers. Kept separate from
// order_counters because proposal numbers run continuously rather than
// resetting per year.
export const proposalCounters = pgTable("proposal_counters", {
  scope: text("scope").primaryKey(),
  seq: integer("seq").notNull().default(0),
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
}, (table) => [
  index("request_items_request_idx").on(table.requestId),
]);
