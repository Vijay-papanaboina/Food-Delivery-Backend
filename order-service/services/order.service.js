import {
  upsertOrder,
  getOrder,
  updateOrderStatus,
} from "../repositories/orders.repo.js";
import {
  getUserOrders,
  getOrderStats as getOrderStatsRepo,
  getRestaurantOrders,
} from "../repositories/orders.stats.repo.js";
import { TOPICS, publishMessage } from "../config/kafka.js";
import { logger } from "../utils/logger.js";
import { Order } from "../db/schema.js";
import { transformOrder } from "../utils/dataTransformation.js";

export const createOrder = async (userId, orderData, producer) => {
  const {
    restaurantId,
    items,
    deliveryAddress,
    customerName,
    customerPhone,
  } = orderData;

  logger.info("Order creation started", {
    userId,
    restaurantId,
    itemsCount: items?.length || 0,
  });

  // Validate required fields
  if (
    !restaurantId ||
    !items ||
    !deliveryAddress ||
    !customerName ||
    !customerPhone
  ) {
    const error = new Error("Missing required fields: restaurantId, items, deliveryAddress, customerName, customerPhone");
    error.statusCode = 400;
    throw error;
  }

  // Validate items array
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Items must be a non-empty array");
    error.statusCode = 400;
    throw error;
  }

  // Validate each item in the array
  for (const [index, item] of items.entries()) {
    if (!item.itemId || !item.price || !item.quantity) {
      const error = new Error(`Item at index ${index} missing required fields: itemId, price, quantity`);
      error.statusCode = 400;
      throw error;
    }
    if (typeof item.price !== "number" || item.price <= 0) {
      const error = new Error(`Item at index ${index} has invalid price: must be a positive number`);
      error.statusCode = 400;
      throw error;
    }
    if (
      typeof item.quantity !== "number" ||
      item.quantity <= 0 ||
      !Number.isInteger(item.quantity)
    ) {
      const error = new Error(`Item at index ${index} has invalid quantity: must be a positive integer`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate data types
  if (typeof restaurantId !== "string" || typeof userId !== "string") {
    const error = new Error("restaurantId and userId must be strings");
    error.statusCode = 400;
    throw error;
  }

  // Validate customer info data types
  if (
    typeof customerName !== "string" ||
    typeof customerPhone !== "string"
  ) {
    const error = new Error("customerName and customerPhone must be strings");
    error.statusCode = 400;
    throw error;
  }

  // Validate deliveryAddress structure
  if (typeof deliveryAddress !== "object" || deliveryAddress === null) {
    const error = new Error("deliveryAddress must be an object");
    error.statusCode = 400;
    throw error;
  }

  const requiredAddressFields = ["street", "city", "state", "zipCode"];
  for (const field of requiredAddressFields) {
    if (
      !deliveryAddress[field] ||
      typeof deliveryAddress[field] !== "string"
    ) {
      const error = new Error(`deliveryAddress.${field} is required and must be a string`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate restaurant status and menu items via restaurant-service
  const restaurantServiceUrl =
    process.env.RESTAURANT_SERVICE_URL || "http://localhost:5006";
  
  const statusResp = await fetch(
    `${restaurantServiceUrl}/api/restaurant-service/restaurants/${restaurantId}/status`,
  );
  if (!statusResp.ok) {
    const error = new Error("Restaurant not found");
    error.statusCode = 400;
    throw error;
  }
  const statusJson = await statusResp.json();
  if (!statusJson.isOpen) {
    const error = new Error("Restaurant is currently closed");
    error.reason = statusJson.reason;
    error.statusCode = 400;
    throw error;
  }

  const itemsToSendForValidation = items.map(item => ({
    itemId: item.itemId,
    quantity: item.quantity,
    price: item.price,
  }));

  const validateResp = await fetch(
    `${restaurantServiceUrl}/api/restaurant-service/restaurants/${restaurantId}/menu/validate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: itemsToSendForValidation }),
    },
  );
  if (!validateResp.ok) {
    const error = new Error("Failed to validate menu items");
    error.statusCode = 400;
    throw error;
  }
  const validateJson = await validateResp.json();
  if (!validateJson.valid) {
    const error = new Error("Invalid menu items");
    error.details = validateJson.errors;
    error.statusCode = 400;
    throw error;
  }

  const validatedItems = validateJson.items;
  const subtotal = validatedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Fetch restaurant details to get delivery fee
  const restaurantResp = await fetch(
    `${restaurantServiceUrl}/api/restaurant-service/restaurants/${restaurantId}`,
  );
  if (!restaurantResp.ok) {
    const error = new Error("Failed to fetch restaurant details");
    error.statusCode = 400;
    throw error;
  }
  const restaurantData = await restaurantResp.json();
  const deliveryFee =
    parseFloat(restaurantData.restaurant.deliveryFee) || 0;

  const total = subtotal + deliveryFee;

  const finalCustomerName = customerName;
  const finalCustomerPhone = customerPhone;

  // Create order with embedded items using Mongoose
  const createdOrder = await Order.create({
    restaurantId,
    userId,
    deliveryAddress,
    customerName: finalCustomerName || null,
    customerPhone: finalCustomerPhone || null,
    status: "pending",
    paymentStatus: "pending",
    total: total,
    items: validatedItems.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      price: item.price,
    })),
    createdAt: new Date(),
    confirmedAt: null,
    deliveredAt: null,
  });

  // Get the complete order with items for response
  const completeOrder = await getOrder(createdOrder._id.toString());

  logger.info("Order created in database", {
    orderId: createdOrder._id.toString(),
    total: createdOrder.total,
  });

  // Publish event AFTER database insert with the generated ID
  await publishMessage(
    producer,
    TOPICS.ORDER_CREATED,
    {
      orderId: createdOrder._id.toString(),
      restaurantId: createdOrder.restaurantId,
      items: validatedItems, 
      userId: createdOrder.userId,
      total: createdOrder.total,
      createdAt: createdOrder.createdAt,
      restaurant: restaurantData.restaurant,
    },
    createdOrder._id.toString(),
  );

  logger.info("Order created event published", {
    orderId: createdOrder._id.toString(),
    topic: TOPICS.ORDER_CREATED,
  });

  return transformOrder(completeOrder);
};

export const getOrderByIdService = async (orderId) => {
  const order = await getOrder(orderId);
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }
  return transformOrder(order);
};

export const listOrdersService = async (userId, status, limit) => {
  const rawOrders = await getUserOrders(userId, {
    status,
    limit,
  });
  return rawOrders.map(transformOrder);
};

export const getOrderStatsService = async () => {
  return await getOrderStatsRepo();
};

export const getRestaurantOrderStatsService = async (restaurantId) => {
  const orders = await getRestaurantOrders(restaurantId, { limit: 100 });
  const stats = {
    totalOrders: orders.length,
    todayOrders: orders.filter(o => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(o.createdAt) >= today;
    }).length,
    todayRevenue: orders
      .filter(o => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(o.createdAt) >= today;
      })
      .reduce((sum, o) => sum + o.total, 0)
      .toFixed(2),
    averagePreparationTime: 15, // Mock value
  };
  return stats;
};

export const updateOrderStatusService = async (orderId, status, paymentStatus) => {
  // Check if order exists first
  const existingOrder = await getOrder(orderId);
  if (!existingOrder) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const confirmedAt =
    status === "confirmed" ? new Date().toISOString() : null;
  const deliveredAt =
    status === "delivered" ? new Date().toISOString() : null;

  const updatedOrder = await updateOrderStatus(
    orderId,
    status,
    paymentStatus,
    confirmedAt,
    deliveredAt,
  );

  logger.info("Order status updated successfully", {
    orderId,
    oldStatus: existingOrder.status,
    newStatus: status,
  });

  return transformOrder(updatedOrder);
};
