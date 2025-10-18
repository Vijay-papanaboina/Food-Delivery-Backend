import { Router } from "express";
import {
  getPaymentForOrder,
  listPayments,
  paymentStats,
  listPaymentMethods,
  processPayment,
} from "../controllers/payments.controller.js";
import { authenticateToken } from "../middleware/auth.js";

export default function paymentsRoutes() {
  const router = Router();

  // Protected routes - require JWT authentication
  router.get("/api/payments/:orderId", authenticateToken, getPaymentForOrder);
  router.get("/api/payments", authenticateToken, listPayments);
  router.get("/api/payments/stats", authenticateToken, paymentStats);
  router.get("/api/payments/methods", listPaymentMethods); // Public - payment methods
  router.post("/api/payments", authenticateToken, processPayment);

  return router;
}
