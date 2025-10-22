import { Router } from "express";
import {
  getDeliveryByOrder,
  listDeliveries,
  listDrivers,
  deliveryStats,
  pickupDeliveryByDriver,
  completeDeliveryByDriver,
  toggleMyAvailability,
  acceptDelivery,
  declineDelivery,
  getDeliveryDetails,
} from "../controllers/delivery.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

export default function deliveryRoutes() {
  const router = Router();

  // Public read-only routes (no authentication required)
  router.get("/api/drivers", listDrivers);
  router.get("/api/delivery/:orderId", getDeliveryByOrder);

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
  router.get(
    "/api/delivery/:deliveryId/details",
    authenticateToken,
    requireRole("driver"),
    getDeliveryDetails
  );
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

  // Gig-worker model routes
  router.patch(
    "/api/drivers/me/availability",
    authenticateToken,
    requireRole("driver"),
    toggleMyAvailability
  );
  router.post(
    "/api/delivery/:deliveryId/accept",
    authenticateToken,
    requireRole("driver"),
    acceptDelivery
  );
  router.post(
    "/api/delivery/:deliveryId/decline",
    authenticateToken,
    requireRole("driver"),
    declineDelivery
  );

  return router;
}
