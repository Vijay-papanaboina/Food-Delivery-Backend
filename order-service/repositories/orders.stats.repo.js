import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { orders } from "../db/schema.js";

export async function listOrdersDrizzle(filters = {}) {
  let query = db
    .select({
      order_id: orders.id,
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
    .orderBy(desc(orders.createdAt));

  const conditions = [];
  if (filters.status) conditions.push(eq(orders.status, filters.status));
  if (filters.userId) conditions.push(eq(orders.userId, filters.userId));
  if (filters.restaurantId)
    conditions.push(eq(orders.restaurantId, filters.restaurantId));
  if (conditions.length) query = query.where(and(...conditions));
  if (filters.limit) query = query.limit(Number(filters.limit));

  const rows = await query;
  return rows.map((row) => ({
    orderId: row.order_id,
    restaurantId: row.restaurant_id,
    userId: row.user_id,
    items:
      typeof row.items_json === "string"
        ? JSON.parse(row.items_json)
        : row.items_json,
    deliveryAddress:
      typeof row.delivery_address_json === "string"
        ? JSON.parse(row.delivery_address_json)
        : row.delivery_address_json,
    status: row.status,
    paymentStatus: row.payment_status,
    total: parseFloat(row.total),
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    deliveredAt: row.delivered_at,
  }));
}

export async function getOrderStatsDrizzle() {
  const totalOrdersRows = await db
    .select({ count: sql`COUNT(*)` })
    .from(orders);
  const deliveredRevenueRows = await db
    .select({ revenue: sql`SUM(${orders.total})` })
    .from(orders)
    .where(eq(orders.status, "delivered"));

  const byStatusRows = await db
    .select({ status: orders.status, count: sql`COUNT(*)` })
    .from(orders)
    .groupBy(orders.status);

  const byRestaurantRows = await db
    .select({ restaurant_id: orders.restaurantId, count: sql`COUNT(*)` })
    .from(orders)
    .groupBy(orders.restaurantId);

  const total = parseInt(totalOrdersRows[0]?.count || 0);
  const totalRevenue = parseFloat(deliveredRevenueRows[0]?.revenue || 0);
  const byStatus = Object.fromEntries(
    byStatusRows.map((r) => [r.status, parseInt(r.count)])
  );
  const byRestaurant = Object.fromEntries(
    byRestaurantRows.map((r) => [r.restaurant_id, parseInt(r.count)])
  );

  return { total, byStatus, byRestaurant, totalRevenue };
}

export async function getOrdersCount() {
  const rows = await db.select({ count: sql`COUNT(*)::int` }).from(orders);
  return rows[0]?.count || 0;
}
