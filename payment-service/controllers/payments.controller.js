import { v4 as uuidv4 } from "uuid";
import {
  upsertPayment,
  getPaymentByOrderId,
  getPayments,
  getPaymentStats,
} from "../repositories/payments.repo.js";
import { TOPICS, publishMessage } from "../config/kafka.js";
import { PAYMENT_CONFIG } from "../config/payment.js";

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
  try {
    const { orderId, amount, method } = req.body;
    const userId = req.user.userId; // Get user ID from JWT token

    // Validate required fields
    if (!orderId || !amount || !method) {
      return res.status(400).json({
        error: "Missing required fields: orderId, amount, method",
      });
    }

    // Validate data types
    if (typeof orderId !== "string" || typeof method !== "string") {
      return res.status(400).json({
        error: "orderId and method must be strings",
      });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        error: "amount must be a positive number",
      });
    }

    // Validate payment method
    if (!PAYMENT_CONFIG.successRates[method]) {
      return res.status(400).json({
        error: `Invalid payment method: ${method}. Available methods: ${Object.keys(
          PAYMENT_CONFIG.successRates
        ).join(", ")}`,
      });
    }

    // Import processPayment handler
    const { processPayment: processPaymentHandler } = await import(
      "../handlers/payment.handlers.js"
    );

    // Process payment
    const payment = await processPaymentHandler(
      orderId,
      amount,
      method,
      userId,
      req.producer,
      "payment-service"
    );

    res.status(201).json({
      message: "Payment processed successfully",
      payment: {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        userId: payment.userId,
        status: payment.status,
        transactionId: payment.transactionId,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt,
      },
    });
  } catch (error) {
    console.error(
      `❌ [payment-service] Error processing payment:`,
      error.message
    );
    res
      .status(500)
      .json({ error: "Failed to process payment", details: error.message });
  }
};
