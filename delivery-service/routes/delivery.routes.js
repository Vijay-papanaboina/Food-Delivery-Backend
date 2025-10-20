import { Router } from "express";
import {
  getDeliveryByOrder,
  listDeliveries,
  listDrivers,
  deliveryStats,
  pickupDeliveryByDriver,
  completeDeliveryByDriver,
} from "../controllers/delivery.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

export default function deliveryRoutes() {
  const router = Router();

  // Public read-only routes (no authentication required)
  router.get("/api/delivery/:orderId", getDeliveryByOrder);
  router.get("/api/delivery", listDeliveries);
  router.get("/api/drivers", listDrivers);
  router.get("/api/delivery/stats", deliveryStats);

  // Protected driver-only routes (require driver role)
  // Note: Manual assignment removed - now using auto-assignment via Kafka
  router.post(
    "/api/delivery/pickup",
    authenticateToken,
    requireRole("driver"),
    pickupDeliveryByDriver
  );
  router.post(
    "/api/delivery/complete",
    authenticateToken,
    requireRole("driver"),
    completeDeliveryByDriver
  );

  return router;
}
