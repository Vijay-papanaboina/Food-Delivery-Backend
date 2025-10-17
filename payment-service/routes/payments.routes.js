import { Router } from "express";
import {
  getPaymentForOrder,
  listPayments,
  paymentStats,
  listPaymentMethods,
  processPayment,
} from "../controllers/payments.controller.js";

export default function paymentsRoutes() {
  const router = Router();
  router.get("/api/payments/:orderId", getPaymentForOrder);
  router.get("/api/payments", listPayments);
  router.get("/api/payments/stats", paymentStats);
  router.get("/api/payments/methods", listPaymentMethods);
  router.post("/api/payments", processPayment);
  return router;
}
