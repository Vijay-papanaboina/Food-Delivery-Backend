import { Router } from "express";
import orders from "./orders.routes.js";

export default function buildRoutes({ producer, serviceName }) {
  const router = Router();
  router.use(orders(producer, serviceName));
  return router;
}


