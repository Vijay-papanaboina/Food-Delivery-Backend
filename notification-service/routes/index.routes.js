import { Router } from "express";
import notifications from "./notifications.routes.js";

export default function buildRoutes() {
  const router = Router();
  router.use(notifications());
  return router;
}


