import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { kitchenOrders } from "../db/schema.js";

export async function upsertKitchenOrder(order) {
  await db
    .insert(kitchenOrders)
    .values({
      orderId: order.orderId,
      restaurantId: order.restaurantId,
      userId: order.userId,
      items: order.items,
      deliveryAddress: order.deliveryAddress,
      customerName: order.customerName || null,
      customerPhone: order.customerPhone || null,
      total: String(order.total),
      status: order.status,
      receivedAt: new Date(order.receivedAt),
      startedAt: order.startedAt ? new Date(order.startedAt) : null,
      estimatedReadyTime: order.estimatedReadyTime
        ? new Date(order.estimatedReadyTime)
        : null,
      readyAt: order.readyAt ? new Date(order.readyAt) : null,
      preparationTime: order.preparationTime || null,
    })
    .onConflictDoUpdate({
      target: kitchenOrders.orderId,
      set: {
        status: sql`excluded.status`,
        startedAt: sql`excluded.started_at`,
        estimatedReadyTime: sql`excluded.estimated_ready_time`,
        readyAt: sql`excluded.ready_at`,
        preparationTime: sql`excluded.preparation_time`,
      },
    });
}

// Simple function to update kitchen order status
export async function updateKitchenOrderStatus(
  orderId,
  status,
  readyAt = null,
  startedAt = null,
  estimatedReadyTime = null,
  preparationTime = null
) {
  const updateData = { status };
  if (readyAt) updateData.readyAt = new Date(readyAt);
  if (startedAt) updateData.startedAt = new Date(startedAt);
  if (estimatedReadyTime)
    updateData.estimatedReadyTime = new Date(estimatedReadyTime);
  if (preparationTime !== null) updateData.preparationTime = preparationTime;

  await db
    .update(kitchenOrders)
    .set(updateData)
    .where(eq(kitchenOrders.orderId, orderId));
}

export async function getKitchenOrder(orderId) {
  const rows = await db
    .select({
      id: kitchenOrders.id,
      order_id: kitchenOrders.orderId,
      restaurant_id: kitchenOrders.restaurantId,
      user_id: kitchenOrders.userId,
      items_json: kitchenOrders.items,
      delivery_address_json: kitchenOrders.deliveryAddress,
      customer_name: kitchenOrders.customerName,
      customer_phone: kitchenOrders.customerPhone,
      total: kitchenOrders.total,
      status: kitchenOrders.status,
      received_at: kitchenOrders.receivedAt,
      started_at: kitchenOrders.startedAt,
      estimated_ready_time: kitchenOrders.estimatedReadyTime,
      ready_at: kitchenOrders.readyAt,
      preparation_time: kitchenOrders.preparationTime,
    })
    .from(kitchenOrders)
    .where(eq(kitchenOrders.orderId, orderId))
    .limit(1);
  if (!rows[0]) return null;
  const row = rows[0];
  return {
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
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    total: parseFloat(row.total),
    status: row.status,
    receivedAt: row.received_at,
    startedAt: row.started_at,
    estimatedReadyTime: row.estimated_ready_time,
    readyAt: row.ready_at,
    preparationTime: row.preparation_time,
  };
}

export async function getKitchenOrders(filters = {}) {
  let query = db
    .select({
      order_id: kitchenOrders.orderId,
      restaurant_id: kitchenOrders.restaurantId,
      user_id: kitchenOrders.userId,
      items_json: kitchenOrders.items,
      total: kitchenOrders.total,
      status: kitchenOrders.status,
      received_at: kitchenOrders.receivedAt,
      started_at: kitchenOrders.startedAt,
      estimated_ready_time: kitchenOrders.estimatedReadyTime,
      ready_at: kitchenOrders.readyAt,
      preparation_time: kitchenOrders.preparationTime,
    })
    .from(kitchenOrders)
    .orderBy(desc(kitchenOrders.receivedAt));

  const conditions = [];
  if (filters.status) conditions.push(eq(kitchenOrders.status, filters.status));
  if (filters.restaurantId)
    conditions.push(eq(kitchenOrders.restaurantId, filters.restaurantId));
  if (conditions.length) query = query.where(and(...conditions));
  if (filters.limit) query = query.limit(Number(filters.limit));

  const rows = await query;
  return rows.map((row) => {
    try {
      row.items =
        typeof row.items_json === "string"
          ? JSON.parse(row.items_json)
          : row.items_json;
    } catch (error) {
      console.error("Failed to parse items_json:", row.items_json, error);
      row.items = [];
    }
    delete row.items_json;
    return row;
  });
}
