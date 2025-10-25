import {
  pgSchema,
  text,
  jsonb,
  timestamp,
  numeric,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

export const order_svc = pgSchema("order_svc");

// Define enums within the schema
export const orderStatusEnum = order_svc.enum("order_status", [
  "pending",
  "payment_failed",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export const paymentStatusEnum = order_svc.enum("payment_status", [
  "pending",
  "processing",
  "paid",
  "failed",
  "refunded",
]);

export const orders = order_svc.table("orders", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  restaurantId: text("restaurant_id").notNull(),
  userId: uuid("user_id").notNull(),
  deliveryAddress: jsonb("delivery_address_json").notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  status: orderStatusEnum("status").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
});

export const orderItems = order_svc.table("order_items", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").notNull(), // References restaurant service menu_items
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
