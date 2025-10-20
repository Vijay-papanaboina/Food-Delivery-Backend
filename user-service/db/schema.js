import {
  pgSchema,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  numeric,
  integer,
} from "drizzle-orm/pg-core";

export const user_svc = pgSchema("user_svc");

export const users = user_svc.table("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userAddresses = user_svc.table("user_addresses", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  userId: uuid("user_id").notNull(),
  label: text("label").notNull(),
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cartItems = user_svc.table("cart_items", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  userId: uuid("user_id").notNull(),
  itemId: uuid("item_id").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
