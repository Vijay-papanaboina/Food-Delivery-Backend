import { stripe } from "../config/stripe.js";
import {
  updatePaymentFields,
  getPaymentByOrderId,
} from "../repositories/payments.repo.js";
import { publishMessage, TOPICS } from "../config/kafka.js";
import { logger } from "../utils/logger.js";

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Ensure we have the raw body
    const body = req.body;
    console.log(
      `🔍 [payment-service] Webhook received - Body type: ${typeof body}, Length: ${
        body?.length || "undefined"
      }`,
    );
    console.log(`🔍 [payment-service] Signature header: ${sig}`);

    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(
      `❌ [payment-service] Webhook signature verification failed: ${err.message}`,
    );
    console.error(`❌ [payment-service] Body received:`, req.body);
    console.error(`❌ [payment-service] Headers:`, req.headers);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📥 [payment-service] Received webhook event: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { orderId, userId } = session.metadata;

    // Check payment status from session
    const isPaymentSuccessful = session.payment_status === "paid";
    const paymentStatus = isPaymentSuccessful ? "success" : "failed";

    console.log(
      `${isPaymentSuccessful ? "✅" : "❌"} [payment-service] Payment ${paymentStatus} for order ${orderId}, session ${session.id}`,
    );
    console.log(
      `💰 [payment-service] Payment status: ${session.payment_status}`,
    );

    try {
      // Find the payment record by orderId
      const payment = await getPaymentByOrderId(orderId);
      if (!payment) {
        console.error(
          `❌ [payment-service] Payment not found for order ${orderId}`,
        );
        return res.status(404).json({ error: "Payment not found" });
      }

      // Extract payment method info from session
      let method = "card"; // Default
      let paymentMethodType = "unknown";

      try {
        // Get payment method types from session
        const paymentMethodTypes = session.payment_method_types || [];
        if (paymentMethodTypes.length > 0) {
          paymentMethodType = paymentMethodTypes[0]; // Use the first/primary method
        }

        // Map Stripe payment method types to our enum
        const methodMap = {
          card: "card",
          us_bank_account: "bank_transfer",
          ach_debit: "bank_transfer",
          sepa_debit: "bank_transfer",
          bancontact: "bank_transfer",
          sofort: "bank_transfer",
          link: "wallet",
          cashapp: "wallet",
          paypal: "wallet",
          klarna: "wallet",
          afterpay_clearpay: "wallet",
        };

        method = methodMap[paymentMethodType] || "card";

        console.log(
          `💳 [payment-service] Payment method: ${paymentMethodType} → ${method}`,
        );
        console.log(`📊 [payment-service] Session payment details:`, {
          payment_status: session.payment_status,
          payment_method_types: session.payment_method_types,
          amount_total: session.amount_total,
          currency: session.currency,
        });
      } catch (error) {
        console.warn(
          `⚠️ [payment-service] Could not extract payment method: ${error.message}`,
        );
        // Use default values
      }

      // Determine failure reason if payment failed
      let failureReason = null;
      if (!isPaymentSuccessful) {
        failureReason =
          session.payment_status === "unpaid"
            ? "Payment incomplete"
            : "Payment failed during checkout";
      }

      // Update payment status and method
      const updateData = {
        status: paymentStatus,
        method: method,
        processedAt: new Date().toISOString(),
      };

      // Add failure reason if payment failed
      if (failureReason) {
        updateData.failureReason = failureReason;
      }

      await updatePaymentFields(payment.payment_id, updateData);

      // Publish payment processed event
      await publishMessage(
        req.producer,
        TOPICS.PAYMENT_PROCESSED,
        {
          orderId,
          paymentId: payment.payment_id,
          amount: session.amount_total / 100,
          status: paymentStatus,
          method: method,
          ...(failureReason && { failureReason }),
          processedAt: new Date().toISOString(),
        },
        orderId,
      );

      console.log(
        `📤 [payment-service] Published payment-processed event for order ${orderId} with status ${paymentStatus}`,
      );
    } catch (error) {
      console.error(
        `❌ [payment-service] Error processing webhook: ${error.message}`,
      );
      return res.status(500).json({ error: "Failed to process webhook" });
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const { orderId, userId } = session.metadata;

    console.log(
      `⏰ [payment-service] Checkout session expired for order ${orderId}, session ${session.id}`,
    );

    try {
      // Find the payment record by orderId
      const payment = await getPaymentByOrderId(orderId);
      if (!payment) {
        console.error(
          `❌ [payment-service] Payment not found for expired order ${orderId}`,
        );
        return res.status(404).json({ error: "Payment not found" });
      }

      // Only update if payment is still pending
      if (payment.status === "pending") {
        // Update payment status to failed due to session expiration
        await updatePaymentFields(payment.payment_id, {
          status: "failed",
          failureReason: "Checkout session expired after 5 minutes",
          processedAt: new Date().toISOString(),
        });

        // Publish payment processed event with failure
        await publishMessage(
          req.producer,
          TOPICS.PAYMENT_PROCESSED,
          {
            orderId,
            paymentId: payment.payment_id,
            amount: session.amount_total / 100,
            status: "failed",
            method: "card", // Default since session expired before completion
            failureReason: "Checkout session expired after 5 minutes",
            processedAt: new Date().toISOString(),
          },
          orderId,
        );

        console.log(
          `💀 [payment-service] Published payment-failed event for expired session ${orderId}`,
        );
      } else {
        console.log(
          `ℹ️ [payment-service] Payment for order ${orderId} already processed (status: ${payment.status}), ignoring expiration`,
        );
      }
    } catch (error) {
      console.error(
        `❌ [payment-service] Error processing expired session webhook: ${error.message}`,
      );
      return res.status(500).json({ error: "Failed to process webhook" });
    }
  }

  res.json({ received: true });
};
