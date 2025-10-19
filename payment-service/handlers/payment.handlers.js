// Removed uuid import - using database-generated IDs now
import {
  upsertPayment,
  getPaymentByOrderId,
  updatePaymentFields,
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

  // Create payment record with status "pending" (let database generate paymentId)
  const payment = {
    // Don't provide paymentId - let database generate it
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

  // Persist to database and get the created payment with generated ID
  const createdPayment = await upsertPayment(payment);

  console.log(
    `💳 [${serviceName}] Created payment ${createdPayment.id} for order ${orderId} (${method}, $${amount}) - Status: pending`
  );

  console.log(`⏳ [${serviceName}] Processing payment ${createdPayment.id}...`);

  // Simulate processing delay
  const delay = PAYMENT_CONFIG.processingDelays[method] || 2000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Simulate payment success/failure
  const successRate = PAYMENT_CONFIG.successRates[method] || 0.9;
  const isSuccess = Math.random() < successRate;

  // Update payment status in database using updatePaymentFields
  await updatePaymentFields(createdPayment.id, {
    status: isSuccess ? "success" : "failed",
    processedAt: new Date().toISOString(),
    transactionId: isSuccess
      ? `txn_${Math.random().toString(36).substr(2, 9)}`
      : null,
    failureReason: isSuccess ? null : getRandomFailureReason(method),
  });

  if (isSuccess) {
    console.log(
      `✅ [${serviceName}] Payment ${createdPayment.id} successful (${method})`
    );
  } else {
    console.log(
      `❌ [${serviceName}] Payment ${
        createdPayment.id
      } failed (${method}): ${getRandomFailureReason(method)}`
    );
  }

  // Publish payment processed event AFTER database update
  await publishMessage(
    producer,
    TOPICS.PAYMENT_PROCESSED,
    {
      paymentId: createdPayment.id,
      orderId,
      amount,
      method,
      status: isSuccess ? "success" : "failed",
      transactionId: isSuccess
        ? `txn_${Math.random().toString(36).substr(2, 9)}`
        : null,
      failureReason: isSuccess ? null : getRandomFailureReason(method),
      processedAt: new Date().toISOString(),
    },
    orderId
  ); // Use orderId as key for partitioning

  console.log(
    `📤 [${serviceName}] Published payment-processed event for order ${orderId}`
  );

  // Return the updated payment object
  return {
    ...createdPayment,
    status: isSuccess ? "success" : "failed",
    processedAt: new Date().toISOString(),
    transactionId: isSuccess
      ? `txn_${Math.random().toString(36).substr(2, 9)}`
      : null,
    failureReason: isSuccess ? null : getRandomFailureReason(method),
  };
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
