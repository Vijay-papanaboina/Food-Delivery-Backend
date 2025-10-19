import { Router } from "express";
import {
  getPaymentForOrder,
  listPayments,
  paymentStats,
  listPaymentMethods,
  processPayment,
} from "../controllers/payments.controller.js";
import { handleStripeWebhook } from "../controllers/webhooks.controller.js";
import { authenticateToken } from "../middleware/auth.js";

export default function paymentsRoutes() {
  const router = Router();

  // Webhook route - no authentication required, uses raw body
  router.post("/api/webhooks/stripe", handleStripeWebhook);

  // Protected routes - require JWT authentication
  router.get("/api/payments/:orderId", authenticateToken, getPaymentForOrder);
  router.get("/api/payments", authenticateToken, listPayments);
  router.get("/api/payments/stats", authenticateToken, paymentStats);
  router.get("/api/payments/methods", listPaymentMethods); // Public - payment methods
  router.post("/api/payments", authenticateToken, processPayment);

  return router;
}
