import { Router } from "express";
import {
  buildCreateOrderController,
  getOrderById,
  listOrders,
  getOrderStats,
  getRestaurantOrderStatsController,
  updateOrderStatusController,
} from "../controllers/orders.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireInternalKey } from "../middleware/internalAuth.js";

export default function orders(producer, serviceName) {
  const router = Router();

  // Protected routes - require JWT authentication
  router.post(
    "/orders",
    authenticateToken,
    buildCreateOrderController(producer, serviceName)
  );
  router.get("/orders/:id", authenticateToken, getOrderById);
  router.get("/orders", authenticateToken, listOrders);
  router.get("/orders/stats", authenticateToken, getOrderStats);
  router.get(
    "/orders/restaurant/:restaurantId/stats",
    authenticateToken,
    getRestaurantOrderStatsController
  );

  // Internal-only route - only Kafka handlers should call this
  router.put(
    "/orders/:orderId/status",
    requireInternalKey,
    updateOrderStatusController
  );

  return router;
}
