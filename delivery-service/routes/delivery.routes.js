import { Router } from "express";
import { getDeliveryByOrder, listDeliveries, listDrivers, deliveryStats } from "../controllers/delivery.controller.js";

export default function deliveryRoutes() {
  const router = Router();
  router.get("/api/delivery/:orderId", getDeliveryByOrder);
  router.get("/api/delivery", listDeliveries);
  router.get("/api/drivers", listDrivers);
  router.get("/api/delivery/stats", deliveryStats);
  return router;
}


