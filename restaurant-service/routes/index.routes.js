import { Router } from "express";
import restaurants from "./restaurants.routes.js";

export default function buildRoutes(producer) {
  const router = Router();
  router.use(restaurants(producer));
  return router;
}
