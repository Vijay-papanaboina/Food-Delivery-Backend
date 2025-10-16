import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { orders } from '../db/schema.js';

export async function upsertOrder(o) {
  await db
    .insert(orders)
    .values({
      orderId: o.orderId,
      restaurantId: o.restaurantId,
      userId: o.userId,
      items: o.items,
      deliveryAddress: o.deliveryAddress,
      status: o.status,
      paymentStatus: o.paymentStatus,
      total: String(o.total),
      createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
      confirmedAt: o.confirmedAt ? new Date(o.confirmedAt) : null,
      deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : null,
    })
    .onConflictDoUpdate({
      target: orders.orderId,
      set: {
        status: sql`excluded.status`,
        paymentStatus: sql`excluded.payment_status`,
        confirmedAt: sql`excluded.confirmed_at`,
        deliveredAt: sql`excluded.delivered_at`,
      },
    });
}

export async function getOrder(orderId) {
  const rows = await db
    .select({
      order_id: orders.orderId,
      restaurant_id: orders.restaurantId,
      user_id: orders.userId,
      items_json: orders.items,
      delivery_address_json: orders.deliveryAddress,
      status: orders.status,
      payment_status: orders.paymentStatus,
      total: orders.total,
      created_at: orders.createdAt,
      confirmed_at: orders.confirmedAt,
      delivered_at: orders.deliveredAt,
    })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .limit(1);
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    orderId: row.order_id,
    restaurantId: row.restaurant_id,
    userId: row.user_id,
    items: typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json,
    deliveryAddress: typeof row.delivery_address_json === 'string' ? JSON.parse(row.delivery_address_json) : row.delivery_address_json,
    status: row.status,
    paymentStatus: row.payment_status,
    total: parseFloat(row.total),
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    deliveredAt: row.delivered_at,
  };
}


