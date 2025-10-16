import { Router } from "express";
import delivery from "./delivery.routes.js";

export default function buildRoutes() {
  const router = Router();
  router.use(delivery());
  return router;
}


