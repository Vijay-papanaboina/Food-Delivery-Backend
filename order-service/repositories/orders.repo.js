import { Order } from "../db/schema.js";
import { logger } from "../utils/logger.js";

export async function upsertOrder(o) {
  try {
    logger.info("Upserting order to database", {
      orderId: o.id,
      restaurantId: o.restaurantId,
      userId: o.userId,
      status: o.status,
    });

    // Mongoose upsert
    const result = await Order.findOneAndUpdate(
      { _id: o.id || o.orderId },
      {
        $set: {
          restaurantId: o.restaurantId,
          userId: o.userId,
          items: o.items, // Assuming items structure matches schema
          deliveryAddress: o.deliveryAddress,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          status: o.status,
          paymentStatus: o.paymentStatus,
          total: o.total,
          createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
          confirmedAt: o.confirmedAt ? new Date(o.confirmedAt) : undefined,
          deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : undefined,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    logger.info("Order upserted successfully", {
      orderId: result._id,
    });

    return result.toObject();
  } catch (error) {
    logger.error("Failed to upsert order", {
      orderId: o.id,
      error: error.message,
    });
    throw error;
  }
}

export async function getOrder(orderId) {
  return await getOrderWithItems(orderId);
}

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

    const result = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true }
    );

    logger.info("Order status updated successfully", {
      orderId,
      status,
      paymentStatus,
    });

    return result.toObject();
  } catch (error) {
    logger.error("Failed to update order status", {
      orderId,
      error: error.message,
    });
    throw error;
  }
}

export async function getOrderWithItems(orderId) {
  try {
    const order = await Order.findById(orderId);

    if (!order) return null;

    return order.toObject();
  } catch (error) {
    logger.error("Failed to get order with items", {
      orderId,
      error: error.message,
    });
    throw error;
  }
}

export async function insertOrderItems(orderId, items) {
  try {
    if (!items || items.length === 0) {
      logger.warn("No items to insert for order", { orderId });
      return [];
    }

    // In Mongoose, items are embedded, so we update the order
    // This function might be redundant if upsertOrder handles items, 
    // but keeping it for compatibility with controller logic if it calls this separately.
    // However, usually insertOrderItems was for SQL relational insert.
    // If the controller calls this AFTER creating the order, we should update the order.
    
    const formattedItems = items.map((item) => ({
      itemId: item.id || item.itemId,
      quantity: item.quantity,
      price: item.price,
    }));

    const result = await Order.findByIdAndUpdate(
      orderId,
      { $push: { items: { $each: formattedItems } } },
      { new: true }
    );

    logger.info("Order items inserted successfully", {
      orderId,
      itemsCount: items.length,
    });

    return result.items.map(item => item.toObject());
  } catch (error) {
    logger.error("Failed to insert order items", {
      orderId,
      error: error.message,
    });
    throw error;
  }
}
