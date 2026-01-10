import { processPaymentService } from "../services/payment.service.js";
import { logger } from "../utils/logger.js";

export const processPayment = async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user?.userId;
  const authToken = req.headers.authorization;

  try {
    const result = await processPaymentService(userId, orderId, authToken);

    res.status(201).json({
      message: "Stripe Checkout session created successfully",
      ...result,
    });
  } catch (error) {
    logger.error("Failed to create payment session", {
      error: error.message,
      orderId,
    });
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    res.status(500).json({
      error: "Failed to create payment session",
      details: error.message,
    });
  }
};