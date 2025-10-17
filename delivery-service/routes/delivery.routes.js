import { Router } from "express";
import {
  getDeliveryByOrder,
  listDeliveries,
  listDrivers,
  deliveryStats,
  assignDeliveryToDriver,
  pickupDeliveryByDriver,
  completeDeliveryByDriver,
} from "../controllers/delivery.controller.js";

export default function deliveryRoutes() {
  const router = Router();
  router.get("/api/delivery/:orderId", getDeliveryByOrder);
  router.get("/api/delivery", listDeliveries);
  router.get("/api/drivers", listDrivers);
  router.get("/api/delivery/stats", deliveryStats);
  router.post("/api/delivery/assign", assignDeliveryToDriver);
  router.post("/api/delivery/pickup", pickupDeliveryByDriver);
  router.post("/api/delivery/complete", completeDeliveryByDriver);
  return router;
}
