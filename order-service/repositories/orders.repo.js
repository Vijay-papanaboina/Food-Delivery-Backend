import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { orders } from "../db/schema.js";
import { createLogger } from "../../shared/utils/logger.js";

export async function upsertOrder(o) {
  const logger = createLogger("order-service");

  try {
    logger.info("Upserting order to database", {
      orderId: o.id,
      restaurantId: o.restaurantId,
      userId: o.userId,
      status: o.status,
    });

    const [result] = await db
      .insert(orders)
      .values({
        id: o.orderId || o.id, // Use orderId if available, fallback to id
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
        target: orders.id, // This will now work because id is properly set
        set: {
          status: sql`excluded.status`,
          paymentStatus: sql`excluded.payment_status`,
          confirmedAt: sql`excluded.confirmed_at`,
          deliveredAt: sql`excluded.delivered_at`,
        },
      })
      .returning();

    logger.info("Order upserted successfully", {
      orderId: o.id,
    });

    return result;
  } catch (error) {
    logger.error("Failed to upsert order", {
      orderId: o.id,
      error: error.message,
    });
    throw error;
  }
}

export async function getOrder(orderId) {
  const rows = await db
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
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    orderId: row.order_id, // This is critical - must be set!
    id: row.order_id, // Also set id for backward compatibility
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
  };
}

// Simple update function for order status changes
export async function updateOrderStatus(
  orderId,
  status,
  paymentStatus = null,
  confirmedAt = null,
  deliveredAt = null
) {
  const logger = createLogger("order-service");

  try {
    const updateData = { status };
    if (paymentStatus !== null) updateData.paymentStatus = paymentStatus;
    if (confirmedAt !== null) updateData.confirmedAt = new Date(confirmedAt);
    if (deliveredAt !== null) updateData.deliveredAt = new Date(deliveredAt);

    const [result] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    logger.info("Order status updated successfully", {
      orderId,
      status,
      paymentStatus,
    });

    return result;
  } catch (error) {
    logger.error("Failed to update order status", {
      orderId,
      error: error.message,
    });
    throw error;
  }
}
