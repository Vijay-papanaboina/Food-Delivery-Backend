import {
  pgSchema,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const delivery_svc = pgSchema("delivery_svc");

// Define enums within the schema
export const deliveryStatusEnum = delivery_svc.enum("delivery_status", [
  "pending_assignment",
  "assigned",
  "picked_up",
  "completed",
  "cancelled",
  "unassigned",
]);

export const acceptanceStatusEnum = delivery_svc.enum("acceptance_status", [
  "pending",
  "accepted",
  "declined",
]);

export const deliveries = delivery_svc.table("deliveries", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  orderId: uuid("order_id").notNull(),
  driverId: uuid("driver_id").notNull(),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone").notNull(),
  vehicle: text("vehicle").notNull(),
  licensePlate: text("license_plate").notNull(),
  deliveryAddress: jsonb("delivery_address_json").notNull(),
  status: deliveryStatusEnum("status").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
  estimatedDeliveryTime: timestamp("estimated_delivery_time", {
    withTimezone: true,
  }),
  actualDeliveryTime: timestamp("actual_delivery_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Gig-worker model fields
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default(
    "3.50"
  ),
  acceptanceStatus:
    acceptanceStatusEnum("acceptance_status").default("pending"),
  declinedByDrivers: text("declined_by_drivers").array().default([]),
  // Restaurant information
  restaurantId: uuid("restaurant_id"),
  restaurantName: text("restaurant_name"),
  restaurantAddress: jsonb("restaurant_address"),
  restaurantPhone: text("restaurant_phone"),
  // Customer information
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  // Order information
  orderItems: jsonb("order_items"),
  orderTotal: numeric("order_total", { precision: 10, scale: 2 }),
});

export const drivers = delivery_svc.table("drivers", {
  // Shared primary key pattern: driver.id === user.id from user_svc.users
  // This creates a 1:1 relationship between users and drivers
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  vehicle: text("vehicle").notNull(),
  licensePlate: text("license_plate").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  currentLocationLat: numeric("current_location_lat", {
    precision: 10,
    scale: 8,
  }),
  currentLocationLng: numeric("current_location_lng", {
    precision: 11,
    scale: 8,
  }),
  rating: numeric("rating", { precision: 3, scale: 2 })
    .notNull()
    .default("0.0"),
  totalDeliveries: numeric("total_deliveries").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
