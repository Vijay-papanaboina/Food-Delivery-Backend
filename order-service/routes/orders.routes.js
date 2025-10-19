import { Router } from "express";
import {
  buildCreateOrderController,
  getOrderById,
  listOrders,
  getOrderStats,
  updateOrderStatusController,
} from "../controllers/orders.controller.js";
import { authenticateToken } from "../middleware/auth.js";

export default function orders(producer, serviceName) {
  const router = Router();

  // Protected routes - require JWT authentication
  router.post(
    "/api/orders",
    authenticateToken,
    buildCreateOrderController(producer, serviceName)
  );
  router.get("/api/orders/:id", authenticateToken, getOrderById);
  router.get("/api/orders", authenticateToken, listOrders);
  router.get("/api/orders/stats", authenticateToken, getOrderStats);
  router.put("/api/orders/:orderId/status", updateOrderStatusController);

  return router;
}
