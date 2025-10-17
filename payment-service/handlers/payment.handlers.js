import { v4 as uuidv4 } from "uuid";
import {
  upsertPayment,
  getPaymentByOrderId,
} from "../repositories/payments.repo.js";
import { publishMessage, TOPICS } from "../config/kafka.js";
import { PAYMENT_CONFIG } from "../config/payment.js";

/**
 * Simulate payment processing with idempotency
 * Prevents duplicate payments for the same order
 * @param {string} orderId - Order ID
 * @param {number} amount - Payment amount
 * @param {string} method - Payment method
 * @param {string} userId - User ID
 * @param {Object} producer - Kafka producer
 * @param {string} serviceName - Service name
 * @returns {Object} Payment record
 */
export async function processPayment(
  orderId,
  amount,
  method,
  userId,
  producer,
  serviceName
) {
  // Check for existing payment for this order (idempotency check)
  const existingPayment = await getPaymentByOrderId(orderId);
  if (existingPayment) {
    console.log(
      `ℹ️ [${serviceName}] Payment already exists for order ${orderId}`
    );
    return existingPayment;
  }

  const paymentId = uuidv4();

  // Create payment record with status "pending"
  const payment = {
    paymentId,
    orderId,
    amount,
    method,
    userId,
    status: "pending",
    createdAt: new Date().toISOString(),
    processedAt: null,
    transactionId: null,
    failureReason: null,
  };

  // Persist to database
  await upsertPayment(payment);

  console.log(
    `💳 [${serviceName}] Created payment ${paymentId} for order ${orderId} (${method}, $${amount}) - Status: pending`
  );

  // Update payment record in database
  payment.status = "processing";
  await upsertPayment(payment);

  console.log(`⏳ [${serviceName}] Processing payment ${paymentId}...`);

  // Simulate processing delay
  const delay = PAYMENT_CONFIG.processingDelays[method] || 2000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Simulate payment success/failure
  const successRate = PAYMENT_CONFIG.successRates[method] || 0.9;
  const isSuccess = Math.random() < successRate;

  // Update payment status in database
  payment.status = isSuccess ? "success" : "failed";
  payment.processedAt = new Date().toISOString();

  if (payment.status === "success") {
    payment.transactionId = `txn_${Math.random().toString(36).substr(2, 9)}`;
    console.log(
      `✅ [${serviceName}] Payment ${paymentId} successful (${method})`
    );
  } else {
    payment.failureReason = getRandomFailureReason(method);
    console.log(
      `❌ [${serviceName}] Payment ${paymentId} failed (${method}): ${payment.failureReason}`
    );
  }

  // Persist final payment status to database
  await upsertPayment(payment);

  // Publish payment processed event
  await publishMessage(
    producer,
    TOPICS.PAYMENT_PROCESSED,
    {
      paymentId,
      orderId,
      amount,
      method,
      status: payment.status,
      transactionId: payment.transactionId,
      failureReason: payment.failureReason,
      processedAt: payment.processedAt,
    },
    orderId
  ); // Use orderId as key for partitioning

  console.log(
    `📤 [${serviceName}] Published payment-processed event for order ${orderId}`
  );

  return payment;
}

/**
 * Get random failure reason based on payment method
 */
function getRandomFailureReason(method) {
  const reasons = {
    credit_card: [
      "Insufficient funds",
      "Card expired",
      "Invalid CVV",
      "Card blocked by bank",
      "Daily limit exceeded",
    ],
    debit_card: [
      "Insufficient funds",
      "Card expired",
      "Invalid PIN",
      "Account frozen",
    ],
    paypal: [
      "PayPal account suspended",
      "Insufficient PayPal balance",
      "Bank account verification failed",
      "PayPal service unavailable",
    ],
    crypto: [
      "Transaction timeout",
      "Insufficient crypto balance",
      "Network congestion",
      "Invalid wallet address",
    ],
  };

  const methodReasons = reasons[method] || ["Payment processing failed"];
  return methodReasons[Math.floor(Math.random() * methodReasons.length)];
}
