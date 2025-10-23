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
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
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
 * Handle delivery picked up event -> update kitchen order status to completed
 * This moves the order from Active Orders to Order History
 */
export async function handleDeliveryPickedUp(eventData, producer, serviceName) {
  const { orderId } = eventData || {};
  if (!orderId) return;

  const order = await getKitchenOrder(orderId);
  if (!order) {
    console.log(
      `⚠️ [${serviceName}] Kitchen order ${orderId} not found for delivery-picked-up`
    );
    return;
  }

  if (order.status === "completed" || order.status === "cancelled") {
    return;
  }

  await updateKitchenOrderStatus(orderId, "completed");
  console.log(
    `✅ [${serviceName}] Order ${orderId} marked as completed (picked up by driver)`
  );
}

/**
 * Handle delivery completed event -> kitchen order already marked as completed on pickup
 * This is a no-op for kitchen orders
 */
export async function handleDeliveryCompleted(
  eventData,
  producer,
  serviceName
) {
  const { orderId } = eventData || {};
  if (!orderId) return;

  console.log(`📦 [${serviceName}] Order ${orderId} delivered to customer`);
  // Kitchen order is already "completed" when picked up, no further action needed
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

  // Calculate timestamps and preparation time
  const now = new Date();
  const startedAt = order.startedAt || order.receivedAt; // Use existing or received time
  const readyAt = now.toISOString();

  // Generate random preparation time between 10-25 minutes
  const minMinutes = 10;
  const maxMinutes = 25;
  const randomMinutes =
    Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
  const estimatedReadyTime = new Date(
    new Date(startedAt).getTime() + randomMinutes * 60 * 1000
  ).toISOString();

  // Calculate actual preparation time in minutes
  const preparationTime = Math.round((now - new Date(startedAt)) / 60000);

  // Update status to ready in database with all timestamps
  await updateKitchenOrderStatus(
    orderId,
    "ready",
    readyAt,
    startedAt,
    estimatedReadyTime,
    preparationTime
  );

  console.log(`✅ [${serviceName}] Order ${orderId} is ready for delivery!`);

  // Fetch restaurant details
  const { getRestaurant } = await import("../repositories/restaurants.repo.js");
  const restaurant = await getRestaurant(order.restaurantId);

  // Publish food-ready event with restaurant and order details
  await publishMessage(
    producer,
    TOPICS.FOOD_READY,
    {
      orderId: order.orderId,
      restaurantId: order.restaurantId,
      userId: order.userId,
      items: order.items,
      total: order.total,
      readyAt: readyAt,
      preparationTime: preparationTime,
      deliveryAddress: order.deliveryAddress,
      // Restaurant information
      restaurant: restaurant
        ? {
            name: restaurant.name,
            address: restaurant.address,
            phone: restaurant.phone,
          }
        : null,
      // Customer information
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
      },
    },
    orderId
  );

  console.log(
    `📤 [${serviceName}] Published food-ready event for order ${orderId}`
  );
}
