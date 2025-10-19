import { upsertRestaurant } from "../repositories/restaurants.repo.js";
import { upsertMenuItem } from "../repositories/menu.repo.js";
import {
  upsertKitchenOrder,
  getKitchenOrder,
  updateKitchenOrderStatus,
} from "../repositories/kitchen.repo.js";
import { publishMessage, TOPICS } from "../config/kafka.js";

// Preparation configuration (10 seconds fixed)
const PREPARATION_CONFIG = {
  minTime: 10000, // 10 seconds in milliseconds
  maxTime: 10000, // 10 seconds in milliseconds
};

/**
 * Handle order confirmed event
 * Creates kitchen order record but does NOT start automatic preparation
 */
export async function handleOrderConfirmed(orderData, producer, serviceName) {
  const { orderId, restaurantId, userId, items, total, deliveryAddress } =
    orderData;

  console.log(
    `🍳 [${serviceName}] Received order ${orderId} for kitchen preparation`
  );

  // Create and persist kitchen order record
  const kitchenOrder = {
    orderId,
    restaurantId,
    userId,
    items,
    total,
    deliveryAddress, // Store delivery address
    status: "received",
    receivedAt: new Date().toISOString(),
    startedAt: null,
    estimatedReadyTime: null,
    readyAt: null,
    preparationTime: null,
  };

  await upsertKitchenOrder(kitchenOrder);

  console.log(
    `✅ [${serviceName}] Kitchen order ${orderId} created with status 'received' - waiting for manual preparation`
  );
}

/**
 * Handle delivery completed event -> update kitchen order status to delivered
 */
export async function handleDeliveryCompleted(
  eventData,
  producer,
  serviceName
) {
  const { orderId } = eventData || {};
  if (!orderId) return;

  const order = await getKitchenOrder(orderId);
  if (!order) {
    console.log(
      `⚠️ [${serviceName}] Kitchen order ${orderId} not found for delivery-completed`
    );
    return;
  }

  if (order.status === "delivered") {
    return;
  }

  await updateKitchenOrderStatus(orderId, "delivered");
  console.log(`🍽️ [${serviceName}] Order ${orderId} marked as delivered`);
}

/**
 * Mark order as ready and publish food-ready event
 */
export async function markOrderReady(orderId, producer, serviceName) {
  const order = await getKitchenOrder(orderId);
  if (!order) {
    console.log(`⚠️ [${serviceName}] Kitchen order ${orderId} not found`);
    return;
  }

  if (order.status === "ready") {
    console.log(`⚠️ [${serviceName}] Order ${orderId} already marked as ready`);
    return;
  }

  // Update status to ready in database
  await updateKitchenOrderStatus(orderId, "ready", new Date().toISOString());

  console.log(`✅ [${serviceName}] Order ${orderId} is ready for delivery!`);

  // Publish food-ready event
  await publishMessage(
    producer,
    TOPICS.FOOD_READY,
    {
      orderId: order.orderId,
      restaurantId: order.restaurantId,
      userId: order.userId,
      items: order.items,
      total: order.total,
      readyAt: order.readyAt,
      preparationTime: order.preparationTime,
      deliveryAddress: order.deliveryAddress, // Add delivery address
    },
    orderId
  );

  console.log(
    `📤 [${serviceName}] Published food-ready event for order ${orderId}`
  );
}
