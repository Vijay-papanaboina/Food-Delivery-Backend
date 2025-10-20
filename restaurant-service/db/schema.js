import {
  pgSchema,
  text,
  boolean,
  timestamp,
  time,
  numeric,
  integer,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const restaurant_svc = pgSchema("restaurant_svc");

export const restaurants = restaurant_svc.table("restaurants", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  ownerId: uuid("owner_id").notNull(),
  name: text("name").notNull(),
  cuisine: text("cuisine").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 })
    .notNull()
    .default("0.0"),
  deliveryTime: text("delivery_time").notNull().default("30-40 min"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("2.99"),
  isOpen: boolean("is_open").notNull().default(true),
  openingTime: time("opening_time"),
  closingTime: time("closing_time"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const menuItems = restaurant_svc.table("menu_items", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  restaurantId: uuid("restaurant_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  preparationTime: integer("preparation_time").notNull().default(15),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const kitchenOrders = restaurant_svc.table("kitchen_orders", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  orderId: uuid("order_id").notNull().unique(), // Reference to order service order ID - must be unique
  restaurantId: uuid("restaurant_id").notNull(),
  userId: uuid("user_id").notNull(),
  items: jsonb("items_json").notNull(),
  deliveryAddress: jsonb("delivery_address_json").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("received"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  estimatedReadyTime: timestamp("estimated_ready_time", { withTimezone: true }),
  readyAt: timestamp("ready_at", { withTimezone: true }),
  preparationTime: integer("preparation_time"),
});
