import { pgSchema, text, jsonb, timestamp, numeric } from 'drizzle-orm/pg-core';

export const order_svc = pgSchema('order_svc');

export const orders = order_svc.table('orders', {
  orderId: text('order_id').primaryKey().notNull(),
  restaurantId: text('restaurant_id').notNull(),
  userId: text('user_id').notNull(),
  items: jsonb('items_json').notNull(),
  deliveryAddress: jsonb('delivery_address_json').notNull(),
  status: text('status').notNull(),
  paymentStatus: text('payment_status').notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
});


