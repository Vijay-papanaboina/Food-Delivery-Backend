import { Router } from "express";
import { buildCreateOrderController, getOrderById, listOrders, getOrderStats } from "../controllers/orders.controller.js";

export default function orders(producer, serviceName) {
  const router = Router();

  router.post("/api/orders", buildCreateOrderController(producer, serviceName));
  router.get("/api/orders/:id", getOrderById);
  router.get("/api/orders", listOrders);
  router.get("/api/orders/stats", getOrderStats);

  return router;
}


