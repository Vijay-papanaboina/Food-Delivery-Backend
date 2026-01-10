import { upsertPayment } from "../repositories/payments.repo.js";
import { logger } from "../utils/logger.js";
import { stripe, STRIPE_CONFIG } from "../config/stripe.js";

export const processPaymentService = async (userId, orderId, authToken) => {
  logger.info("Creating Stripe Checkout session", {
    orderId,
    userId,
  });

  // Validate required fields
  if (!orderId || typeof orderId !== "string") {
    const error = new Error("Invalid orderId: must be a string");
    error.statusCode = 400;
    throw error;
  }

  // Fetch actual order details from order service to get real prices and items
  const orderServiceUrl =
    process.env.ORDER_SERVICE_URL || "http://localhost:5001";
  
  const orderResponse = await fetch(
    `${orderServiceUrl}/api/order-service/orders/${orderId}`,
    {
      headers: {
        Authorization: authToken, // Pass through JWT token
      },
    },
  );

  if (!orderResponse.ok) {
    const error = new Error("Order not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  const orderData = await orderResponse.json();
  const order = orderData.order;

  // Verify the order belongs to the authenticated user
  if (order.userId !== userId) {
    const error = new Error("Access denied: Order does not belong to user");
    error.statusCode = 403;
    throw error;
  }

  // Check if order payment is pending
  if (order.paymentStatus !== "pending") {
    const error = new Error(`Order payment is not pending. Current payment status: ${order.paymentStatus}`);
    error.statusCode = 400;
    throw error;
  }

  // Fetch item names from restaurant service for better Stripe display
  const restaurantServiceUrl =
    process.env.RESTAURANT_SERVICE_URL || "http://localhost:5006";
  let itemNames = {};

  try {
    // Get restaurant menu items to map item IDs to names
    const menuResponse = await fetch(
      `${restaurantServiceUrl}/api/restaurant-service/restaurants/${order.restaurantId}/menu`,
      {
        headers: {
          Authorization: authToken,
        },
      },
    );

    if (menuResponse.ok) {
      const menuData = await menuResponse.json();
      logger.info("Fetched menu data from restaurant service", {
        restaurantId: order.restaurantId,
        menuItemsCount: menuData.menu?.length || 0,
      });
      itemNames = menuData.menu.reduce((acc, item) => {
        acc[item.itemId] = item.name;
        return acc;
      }, {});
      logger.info("Item names mapping created", { itemNames });
    } else {
      logger.warn("Failed to fetch menu from restaurant service", {
        status: menuResponse.status,
        statusText: menuResponse.statusText,
      });
    }
  } catch (error) {
    logger.warn("Failed to fetch item names from restaurant service", {
      error: error.message,
    });
  }

  // Calculate subtotal and delivery fee
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = order.total - subtotal;

  // Create line items for Stripe
  const lineItems = [];

  // Add individual food items
  order.items.forEach((item) => {
    const itemName = itemNames[item.itemId] || `Item ${item.itemId}`;
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: itemName,
          description: `Quantity: ${item.quantity}`,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    });
  });

  // Add delivery fee as separate line item
  if (deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Delivery Fee",
          description: "Delivery service charge",
        },
        unit_amount: Math.round(deliveryFee * 100), // Convert to cents
      },
      quantity: 1,
    });
  }

  logger.info("Creating Stripe session with detailed line items", {
    orderId,
    itemCount: order.items.length,
    subtotal,
    deliveryFee,
    total: order.total,
    lineItemsCount: lineItems.length,
  });

  // Create Stripe Checkout session with actual order items
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: STRIPE_CONFIG.successUrl,
    cancel_url: STRIPE_CONFIG.cancelUrl,
    metadata: { orderId, userId },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 5 minutes from now
  });

  // Save pending payment with actual amount from database
  await upsertPayment({
    orderId,
    amount: order.total, // Use actual total from database, not frontend
    method: "card", // Default to card, will be updated in webhook with actual method
    userId,
    status: "pending",
    transactionId: session.id,
    createdAt: new Date().toISOString(),
    processedAt: null,
    failureReason: null,
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
};
