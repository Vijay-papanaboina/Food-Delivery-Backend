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
  router.get("/drivers", listDrivers);

  // Protected driver-only routes (require driver role)
  // IMPORTANT: Define specific routes BEFORE parameterized routes
  router.get(
    "/delivery/stats",
    authenticateToken,
    requireRole("driver"),
    deliveryStats
  );
  router.get(
    "/delivery",
    authenticateToken,
    requireRole("driver"),
    listDeliveries
  );
  router.get(
    "/delivery/:deliveryId/details",
    authenticateToken,
    requireRole("driver"),
    getDeliveryDetails
  );

  // Parameterized routes - must come AFTER specific routes
  router.get("/delivery/:orderId", getDeliveryByOrder);
  router.post(
    "/delivery/pickup",
    authenticateToken,
    requireRole("driver"),
    pickupDeliveryByDriver
  );
  router.post(
    "/delivery/complete",
    authenticateToken,
    requireRole("driver"),
    completeDeliveryByDriver
  );

  // Gig-worker model routes
  router.patch(
    "/drivers/me/availability",
    authenticateToken,
    requireRole("driver"),
    toggleMyAvailability
  );
  router.post(
    "/delivery/:deliveryId/accept",
    authenticateToken,
    requireRole("driver"),
    acceptDelivery
  );
  router.post(
    "/delivery/:deliveryId/decline",
    authenticateToken,
    requireRole("driver"),
    declineDelivery
  );

  return router;
}
