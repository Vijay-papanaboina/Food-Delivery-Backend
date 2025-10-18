import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import cartRoutes from "./cart.routes.js";

export default function createRoutes(serviceName) {
  const router = Router();

  // Mount route modules
  router.use("/", authRoutes(serviceName));
  router.use("/", userRoutes(serviceName));
  router.use("/", cartRoutes(serviceName));

  return router;
}
