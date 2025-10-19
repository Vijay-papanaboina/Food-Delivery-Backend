import { stripe } from "../config/stripe.js";
import {
  updatePaymentFields,
  getPaymentByOrderId,
} from "../repositories/payments.repo.js";
import { publishMessage, TOPICS } from "../config/kafka.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("payment-service");

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Ensure we have the raw body
    const body = req.body;
    console.log(
      `🔍 [payment-service] Webhook received - Body type: ${typeof body}, Length: ${
        body?.length || "undefined"
      }`
    );
    console.log(`🔍 [payment-service] Signature header: ${sig}`);

    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(
      `❌ [payment-service] Webhook signature verification failed: ${err.message}`
    );
    console.error(`❌ [payment-service] Body received:`, req.body);
    console.error(`❌ [payment-service] Headers:`, req.headers);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📥 [payment-service] Received webhook event: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { orderId, userId } = session.metadata;

    console.log(
      `✅ [payment-service] Payment successful for order ${orderId}, session ${session.id}`
    );

    try {
      // Find the payment record by transactionId (Stripe session ID)
      const payment = await getPaymentByOrderId(orderId);
      if (!payment) {
        console.error(
          `❌ [payment-service] Payment not found for order ${orderId}`
        );
        return res.status(404).json({ error: "Payment not found" });
      }

      // Update payment status using the payment's internal ID
      await updatePaymentFields(payment.payment_id, {
        status: "success",
        processedAt: new Date().toISOString(),
      });

      // Publish payment processed event
      await publishMessage(
        req.producer,
        TOPICS.PAYMENT_PROCESSED,
        {
          orderId,
          paymentId: payment.payment_id,
          amount: session.amount_total / 100,
          status: "success",
          processedAt: new Date().toISOString(),
        },
        orderId
      );

      console.log(
        `📤 [payment-service] Published payment-processed event for order ${orderId}`
      );
    } catch (error) {
      console.error(
        `❌ [payment-service] Error processing webhook: ${error.message}`
      );
      return res.status(500).json({ error: "Failed to process webhook" });
    }
  }

  res.json({ received: true });
};
