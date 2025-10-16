import { Router } from "express";
import payments from "./payments.routes.js";

export default function buildRoutes() {
  const router = Router();
  router.use(payments());
  return router;
}


