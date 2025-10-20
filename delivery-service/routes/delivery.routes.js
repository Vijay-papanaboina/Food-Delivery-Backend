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
  router.get("/api/drivers", listDrivers);

  // Protected driver-only routes (require driver role)
  router.get(
    "/api/delivery/stats",
    authenticateToken,
    requireRole("driver"),
    deliveryStats
  );
  router.get(
    "/api/delivery",
    authenticateToken,
    requireRole("driver"),
    listDeliveries
  );
  router.get("/api/delivery/:orderId", getDeliveryByOrder);
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
