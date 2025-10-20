import { v4 as uuidv4 } from "uuid";
// Removed PowerShell toast execution; notifications are simulated via logs only
import { TOPICS } from "../config/kafka.js";

// Notification templates for different event types
export const NOTIFICATION_TEMPLATES = {
  [TOPICS.ORDER_CREATED]: {
    type: "order_created",
    title: "Order Placed Successfully!",
    message: (data) =>
      `Your order #${data.orderId.slice(
        -8
      )} has been placed and is being prepared. Total: $${parseFloat(
        data.total
      ).toFixed(2)}`,
    priority: "high",
  },
  [TOPICS.PAYMENT_PROCESSED]: {
    type: "payment_processed",
    title: (data) =>
      data.status === "success" ? "Payment Successful!" : "Payment Failed",
    message: (data) =>
      data.status === "success"
        ? `Payment of $${data.amount.toFixed(
            2
          )} has been processed successfully.`
        : `Payment failed: ${data.failureReason || "Unknown error"}`,
    priority: "high",
  },
  // inventory topic removed
  [TOPICS.ORDER_CONFIRMED]: {
    type: "order_confirmed",
    title: "Order Confirmed!",
    message: (data) =>
      `Your order #${data.orderId.slice(
        -8
      )} has been confirmed and is being prepared.`,
    priority: "high",
  },
  [TOPICS.FOOD_READY]: {
    type: "food_ready",
    title: "Your Food is Ready!",
    message: (data) =>
      `Your order #${data.orderId.slice(
        -8
      )} is ready and has been assigned to a driver.`,
    priority: "high",
  },
  [TOPICS.DELIVERY_ASSIGNED]: {
    type: "delivery_assigned",
    title: "Driver Assigned!",
    message: (data) =>
      `Your order #${data.orderId.slice(
        -8
      )} has been assigned to a driver and is on its way.`,
    priority: "high",
  },
  [TOPICS.DELIVERY_PICKED_UP]: {
    type: "delivery_picked_up",
    title: "Order Picked Up!",
    message: (data) =>
      `Your order #${data.orderId.slice(
        -8
      )} has been picked up from the restaurant and is on its way to you.`,
    priority: "high",
  },
  [TOPICS.DELIVERY_COMPLETED]: {
    type: "delivery_completed",
    title: "Order Delivered!",
    message: (data) =>
      `Your order #${data.orderId.slice(
        -8
      )} has been delivered successfully. Enjoy your meal!`,
    priority: "high",
    shouldShowToast: (data) => true, // Always show toast for delivery completion
  },
};

/**
 * Handle events from any topic and generate notifications
 * @param {string} topic - Kafka topic name
 * @param {Object} data - Event data
 */
export async function handleEvent(topic, data, serviceName) {
  const template = NOTIFICATION_TEMPLATES[topic];

  if (!template) {
    console.log(
      `⚠️ [${serviceName}] No notification template for topic: ${topic}`
    );
    return;
  }

  // Extract user ID from data (different events have different structures)
  let userId = data.userId;
  if (!userId && data.orderId) {
    // For events without direct userId, we might need to look it up
    // For now, we'll use a placeholder or extract from orderId
    userId = `user-${data.orderId.slice(-6)}`;
  }

  if (!userId) {
    console.log(
      `⚠️ [${serviceName}] No userId found in event data for topic: ${topic}`
    );
    return;
  }

  // Generate notification
  const notification = {
    notificationId: uuidv4(),
    userId,
    type: template.type,
    title:
      typeof template.title === "function"
        ? template.title(data)
        : template.title,
    message: template.message(data),
    priority: template.priority,
    topic,
    eventData: data,
    createdAt: new Date().toISOString(),
    read: false,
    shouldShowToast: template.shouldShowToast
      ? template.shouldShowToast(data)
      : true,
  };

  // Simulate sending notification (log-only, no DB persistence)
  await sendNotification(notification, serviceName);
}

export async function sendNotification(notification, serviceName) {
  try {
    // Generate a unique ID for the notification if not provided
    if (!notification.notificationId) {
      notification.notificationId = uuidv4();
    }

    // Set default values if not provided
    notification.createdAt = notification.createdAt || new Date().toISOString();
    notification.read = notification.read || false;
    notification.shouldShowToast = notification.shouldShowToast !== false;

    // Simulate delivery delay
    await new Promise((resolve) =>
      setTimeout(resolve, 50 + Math.random() * 100)
    );

    console.log(
      `📱 [${serviceName}] ${notification.title} → ${notification.userId}`
    );
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Error sending notification:`,
      error.message
    );
    throw error;
  }
}
