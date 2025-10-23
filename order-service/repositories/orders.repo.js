import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { orders, orderItems } from "../db/schema.js";
import { logger } from "../utils/logger.js";

export async function upsertOrder(o) {
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
        customerName: o.customerName || null,
        customerPhone: o.customerPhone || null,
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
  // Use the new getOrderWithItems function since we need items
  return await getOrderWithItems(orderId);
}

// Simple update function for order status changes
export async function updateOrderStatus(
  orderId,
  status,
  paymentStatus = null,
  confirmedAt = null,
  deliveredAt = null
) {
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

// Get order with items - joins orders + order_items tables
export async function getOrderWithItems(orderId) {
  try {
    // Get order details
    const orderRows = await db
      .select({
        order_id: orders.id,
        restaurant_id: orders.restaurantId,
        user_id: orders.userId,
        delivery_address_json: orders.deliveryAddress,
        customer_name: orders.customerName,
        customer_phone: orders.customerPhone,
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

    if (!orderRows[0]) return null;
    const orderRow = orderRows[0];

    // Get order items
    const itemRows = await db
      .select({
        item_id: orderItems.itemId,
        quantity: orderItems.quantity,
        price: orderItems.price,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Transform to match frontend expectations
    const order = {
      orderId: orderRow.order_id,
      id: orderRow.order_id,
      restaurantId: orderRow.restaurant_id,
      userId: orderRow.user_id,
      items: itemRows.map((item) => ({
        itemId: item.item_id,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
      deliveryAddress:
        typeof orderRow.delivery_address_json === "string"
          ? JSON.parse(orderRow.delivery_address_json)
          : orderRow.delivery_address_json,
      customerName: orderRow.customer_name,
      customerPhone: orderRow.customer_phone,
      status: orderRow.status,
      paymentStatus: orderRow.payment_status,
      total: parseFloat(orderRow.total),
      createdAt: orderRow.created_at,
      confirmedAt: orderRow.confirmed_at,
      deliveredAt: orderRow.delivered_at,
    };

    logger.info("Order with items retrieved successfully", {
      orderId,
      itemsCount: order.items.length,
    });

    return order;
  } catch (error) {
    logger.error("Failed to get order with items", {
      orderId,
      error: error.message,
    });
    throw error;
  }
}

// Insert order items into order_items table
export async function insertOrderItems(orderId, items) {
  try {
    if (!items || items.length === 0) {
      logger.warn("No items to insert for order", { orderId });
      return [];
    }

    const orderItemsData = items.map((item) => ({
      orderId: orderId,
      itemId: item.id || item.itemId, // Support both formats
      quantity: item.quantity,
      price: String(item.price), // Convert to string for numeric field
    }));

    const insertedItems = await db
      .insert(orderItems)
      .values(orderItemsData)
      .returning();

    logger.info("Order items inserted successfully", {
      orderId,
      itemsCount: insertedItems.length,
    });

    return insertedItems;
  } catch (error) {
    logger.error("Failed to insert order items", {
      orderId,
      error: error.message,
    });
    throw error;
  }
}
