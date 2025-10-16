import { Router } from "express";
import restaurants from "./restaurants.routes.js";

export default function buildRoutes() {
  const router = Router();
  router.use(restaurants());
  return router;
}


