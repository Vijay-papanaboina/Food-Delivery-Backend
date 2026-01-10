import { stripe } from "../config/stripe.js";
import {
  updatePaymentFields,
  getPaymentByOrderId,
} from "../repositories/payments.repo.js";
import { publishMessage, TOPICS } from "../config/kafka.js";
import { logger } from "../utils/logger.js";

export const handleWebhookService = async (body, signature, producer) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    logger.error("Webhook signature verification failed", { error: err.message });
    throw new Error(`Webhook Error: ${err.message}`);
  }

  logger.info(`Received webhook event: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { orderId } = session.metadata;

    const isPaymentSuccessful = session.payment_status === "paid";
    const paymentStatus = isPaymentSuccessful ? "success" : "failed";

    try {
      // Find the payment record by orderId
      const payment = await getPaymentByOrderId(orderId);
      if (!payment) {
        const error = new Error("Payment not found");
        error.statusCode = 404;
        throw error;
      }

      // Extract payment method info
      let method = "card"; 
      let paymentMethodType = "unknown";

      try {
        const paymentMethodTypes = session.payment_method_types || [];
        if (paymentMethodTypes.length > 0) {
          paymentMethodType = paymentMethodTypes[0];
        }

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
      } catch (error) {
        logger.warn("Could not extract payment method", { error: error.message });
      }

      // Determine failure reason
      let failureReason = null;
      if (!isPaymentSuccessful) {
        failureReason =
          session.payment_status === "unpaid"
            ? "Payment incomplete"
            : "Payment failed during checkout";
      }

      // Update payment status
      const updateData = {
        status: paymentStatus,
        method: method,
        processedAt: new Date().toISOString(),
      };

      if (failureReason) {
        updateData.failureReason = failureReason;
      }

      await updatePaymentFields(payment.payment_id, updateData);

      // Publish event
      await publishMessage(
        producer,
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

      logger.info(`Published payment-processed event for order ${orderId} with status ${paymentStatus}`);
    } catch (error) {
      logger.error("Error processing checkout.session.completed", { error: error.message });
      // Don't throw here to avoid failing the webhook response if possible, or throw to retry
      throw error;
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const { orderId } = session.metadata;

    logger.info(`Checkout session expired for order ${orderId}`);

    try {
      const payment = await getPaymentByOrderId(orderId);
      if (!payment) {
        const error = new Error("Payment not found");
        error.statusCode = 404;
        throw error;
      }

      if (payment.status === "pending") {
        await updatePaymentFields(payment.payment_id, {
          status: "failed",
          failureReason: "Checkout session expired after 5 minutes",
          processedAt: new Date().toISOString(),
        });

        await publishMessage(
          producer,
          TOPICS.PAYMENT_PROCESSED,
          {
            orderId,
            paymentId: payment.payment_id,
            amount: session.amount_total / 100,
            status: "failed",
            method: "card",
            failureReason: "Checkout session expired after 5 minutes",
            processedAt: new Date().toISOString(),
          },
          orderId,
        );

        logger.info(`Published payment-failed event for expired session ${orderId}`);
      }
    } catch (error) {
      logger.error("Error processing checkout.session.expired", { error: error.message });
      throw error;
    }
  }

  return { received: true };
};
