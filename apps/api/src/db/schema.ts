import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * 望舒 WANGSHU 数据模型（Demo v0.1，17 张表）。
 *
 * 约定：
 * - 金额一律 integer，单位「分」，避免浮点误差。
 * - 时间一律 text，存 ISO 8601（UTC），展示层再转 Asia/Shanghai。
 * - 订单配置存完整报价快照（QuoteResult JSON），保证历史订单可复现。
 */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const models = sqliteTable("models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  enName: text("en_name").notNull(),
  body: text("body").notNull(),
  segment: text("segment").notNull(),
  priceFrom: integer("price_from").notNull(),
  seats: integer("seats").notNull(),
  tagline: text("tagline").notNull(),
  heroImage: text("hero_image").notNull(),
  createdAt: text("created_at").notNull(),
});

export const trims = sqliteTable("trims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  modelId: integer("model_id")
    .notNull()
    .references(() => models.id),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  rangeKm: integer("range_km").notNull(),
  zero100: real("zero_100").notNull(),
  powerKw: integer("power_kw").notNull(),
  rank: integer("rank").notNull(),
});

export const paints = sqliteTable("paints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  hex: text("hex").notNull(),
  price: integer("price").notNull(),
});

export const wheels = sqliteTable("wheels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sizeInch: integer("size_inch").notNull(),
  price: integer("price").notNull(),
  rangeDelta: integer("range_delta").notNull(),
});

export const interiors = sqliteTable("interiors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  hex: text("hex").notNull(),
  price: integer("price").notNull(),
});

export const packages = sqliteTable("packages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull(),
});

/**
 * 车型可选项。kind: paint | wheel | interior | package。
 * price 是该车型下的实际售价（种子与基础表一致；后台可按车型调价）。
 */
export const modelOptions = sqliteTable(
  "model_options",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    modelId: integer("model_id")
      .notNull()
      .references(() => models.id),
    kind: text("kind").notNull(),
    optionId: integer("option_id").notNull(),
    price: integer("price").notNull(),
    available: integer("available").notNull().default(1),
  },
  (table) => [
    uniqueIndex("model_options_unique").on(
      table.modelId,
      table.kind,
      table.optionId,
    ),
  ],
);

/**
 * 配置约束。ifOption 形如 "wheel:3"（选项 id 而非名称）。
 * 命中 ifOption 后：rank 低于 minTrimRank、缺少 requiresOption、
 * 或同时选中 excludesOption，即判为非法组合。
 */
export const optionRules = sqliteTable("option_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  modelId: integer("model_id")
    .notNull()
    .references(() => models.id),
  ifOption: text("if_option").notNull(),
  requiresOption: text("requires_option"),
  excludesOption: text("excludes_option"),
  minTrimRank: integer("min_trim_rank"),
  message: text("message").notNull(),
});

export const configs = sqliteTable("configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shareId: text("share_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  modelId: integer("model_id")
    .notNull()
    .references(() => models.id),
  payloadJson: text("payload_json").notNull(),
  priceSnapshot: text("price_snapshot").notNull(),
  createdAt: text("created_at").notNull(),
});

export const stores = sqliteTable("stores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  hours: text("hours").notNull(),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  configId: integer("config_id").references(() => configs.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  city: text("city"),
  storeId: integer("store_id").references(() => stores.id),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull(),
});

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id),
  slot: text("slot").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNo: text("order_no").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  configId: integer("config_id").references(() => configs.id),
  modelSlug: text("model_slug").notNull(),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  configJson: text("config_json").notNull(),
  depositAmount: integer("deposit_amount").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("pending_payment"),
  createdAt: text("created_at").notNull(),
  paidAt: text("paid_at"),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  provider: text("provider").notNull().default("mock"),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  paidAt: text("paid_at").notNull(),
  rawJson: text("raw_json"),
});

/** 价格参数（税率、减免、保险、上牌、定金）。key 与共享类型 PriceSettings 字段同名。 */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/** 新闻/内容：后台可维护，公网只读已发布。 */
export const news = sqliteTable("news", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  tag: text("tag").notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("published"),
  publishedAt: text("published_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
