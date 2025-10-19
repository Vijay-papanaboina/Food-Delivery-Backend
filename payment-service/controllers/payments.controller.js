import { v4 as uuidv4 } from "uuid";
import {
  upsertPayment,
  getPaymentByOrderId,
  getPayments,
  getPaymentStats,
} from "../repositories/payments.repo.js";
import { TOPICS, publishMessage } from "../config/kafka.js";
import { PAYMENT_CONFIG } from "../config/payment.js";
import { createLogger, sanitizeForLogging } from "../../shared/utils/logger.js";
import { stripe, STRIPE_CONFIG } from "../config/stripe.js";

export const getPaymentForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId
    if (!orderId || typeof orderId !== "string") {
      return res
        .status(400)
        .json({ error: "Invalid orderId: must be a non-empty string" });
    }

    const payment = await getPaymentByOrderId(orderId);
    if (!payment)
      return res
        .status(404)
        .json({ error: "Payment not found for this order" });

    // Transform database fields to camelCase for API response
    const transformedPayment = {
      paymentId: payment.payment_id,
      orderId: payment.order_id,
      amount: parseFloat(payment.amount),
      method: payment.method,
      userId: payment.user_id,
      status: payment.status,
      transactionId: payment.transaction_id,
      failureReason: payment.failure_reason,
      createdAt: payment.created_at,
      processedAt: payment.processed_at,
    };

    res.json({
      message: "Payment retrieved successfully",
      payment: transformedPayment,
    });
  } catch (error) {
    console.error(
      `❌ [payment-service] Error retrieving payment:`,
      error.message
    );
    res
      .status(500)
      .json({ error: "Failed to retrieve payment", details: error.message });
  }
};

export const listPayments = async (req, res) => {
  try {
    const userId = req.user.userId; // Get user ID from JWT token
    const payments = await getPayments({ ...req.query, userId });
    res.json({
      message: "Payments retrieved successfully",
      payments,
      total: payments.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve payments", details: error.message });
  }
};

export const paymentStats = async (req, res) => {
  try {
    const stats = await getPaymentStats();
    res.json({ message: "Payment statistics retrieved successfully", stats });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve payment statistics",
      details: error.message,
    });
  }
};

export const listPaymentMethods = (req, res) => {
  try {
    const methods = Object.keys(PAYMENT_CONFIG.successRates).map((method) => ({
      method,
      successRate: PAYMENT_CONFIG.successRates[method],
      processingDelay: PAYMENT_CONFIG.processingDelays[method],
    }));
    res.json({ message: "Payment methods retrieved successfully", methods });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve payment methods",
      details: error.message,
    });
  }
};

export const processPayment = async (req, res) => {
  const logger = createLogger("payment-service");
  const { orderId } = req.body; // Remove amount - we'll fetch it from order service
  const userId = req.user?.userId; // Get user ID from JWT token

  try {
    logger.info("Creating Stripe Checkout session", {
      orderId,
      userId,
    });

    // Validate required fields
    if (!orderId) {
      return res.status(400).json({
        error: "Missing required field: orderId",
      });
    }

    // Validate data types
    if (typeof orderId !== "string") {
      return res.status(400).json({
        error: "orderId must be a string",
      });
    }

    // Fetch actual order details from order service to get real prices and items
    const orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:5001";
    const orderResponse = await fetch(
      `${orderServiceUrl}/api/orders/${orderId}`,
      {
        headers: {
          Authorization: req.headers.authorization, // Pass through JWT token
        },
      }
    );

    if (!orderResponse.ok) {
      return res.status(404).json({
        error: "Order not found or access denied",
      });
    }

    const orderData = await orderResponse.json();
    const order = orderData.order;

    // Verify the order belongs to the authenticated user
    if (order.userId !== userId) {
      return res.status(403).json({
        error: "Access denied: Order does not belong to user",
      });
    }

    // Check if order is in pending_payment status
    if (order.status !== "pending_payment") {
      return res.status(400).json({
        error: `Order is not in pending payment status. Current status: ${order.status}`,
      });
    }

    // Fetch item names from restaurant service for better Stripe display
    const restaurantServiceUrl =
      process.env.RESTAURANT_SERVICE_URL || "http://localhost:5006";
    let itemNames = {};

    try {
      // Get restaurant menu items to map item IDs to names
      const menuResponse = await fetch(
        `${restaurantServiceUrl}/api/restaurants/${order.restaurantId}/menu`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
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
      0
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
    });

    // Save pending payment with actual amount from database
    await upsertPayment({
      orderId,
      amount: order.total, // Use actual total from database, not frontend
      method: "stripe",
      userId,
      status: "pending",
      transactionId: session.id,
      createdAt: new Date().toISOString(),
      processedAt: null,
      failureReason: null,
    });

    logger.info("Stripe Checkout session created", {
      sessionId: session.id,
      orderId,
      actualAmount: order.total,
      itemCount: order.items.length,
    });

    res.status(201).json({
      message: "Stripe Checkout session created successfully",
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error("Failed to create Stripe Checkout session", {
      error: error.message,
      stack: error.stack,
      orderId,
    });
    console.error(
      `❌ [payment-service] Error creating Stripe session:`,
      error.message
    );
    res.status(500).json({
      error: "Failed to create payment session",
      details: error.message,
    });
  }
};
