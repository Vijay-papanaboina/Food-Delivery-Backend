import { pgSchema, text, timestamp, boolean, numeric, jsonb } from 'drizzle-orm/pg-core';

export const delivery_svc = pgSchema('delivery_svc');

export const deliveries = delivery_svc.table('deliveries', {
  deliveryId: text('delivery_id').primaryKey().notNull(),
  orderId: text('order_id').notNull(),
  driverId: text('driver_id').notNull(),
  driverName: text('driver_name').notNull(),
  driverPhone: text('driver_phone').notNull(),
  vehicle: text('vehicle').notNull(),
  licensePlate: text('license_plate').notNull(),
  deliveryAddress: jsonb('delivery_address_json').notNull(),
  status: text('status').notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  estimatedDeliveryTime: timestamp('estimated_delivery_time', { withTimezone: true }),
  actualDeliveryTime: timestamp('actual_delivery_time', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const drivers = delivery_svc.table('drivers', {
  driverId: text('driver_id').primaryKey().notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  vehicle: text('vehicle').notNull(),
  licensePlate: text('license_plate').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  currentLocationLat: numeric('current_location_lat', { precision: 10, scale: 8 }),
  currentLocationLng: numeric('current_location_lng', { precision: 11, scale: 8 }),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0.0'),
  totalDeliveries: numeric('total_deliveries').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});


