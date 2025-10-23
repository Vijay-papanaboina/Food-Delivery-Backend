import { Router } from "express";
import { processPayment } from "../controllers/payments.controller.js";
import { handleStripeWebhook } from "../controllers/webhooks.controller.js";
import { authenticateToken } from "../middleware/auth.js";

export default function paymentsRoutes() {
  const router = Router();

  // Webhook route - no authentication required, uses raw body
  router.post("/webhooks/stripe", handleStripeWebhook);

  // Protected route - create Stripe checkout session
  router.post("/payments", authenticateToken, processPayment);

  return router;
}
