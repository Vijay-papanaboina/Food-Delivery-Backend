import { Router } from "express";
import {
  signup,
  login,
  refreshToken,
  validateToken,
} from "../controllers/auth.controller.js";
import {
  validateSignup,
  validateLogin,
  validateRefreshToken,
} from "../middleware/validation.js";

export default function authRoutes(serviceName) {
  const router = Router();

  // Public auth routes
  router.post("/api/auth/signup", validateSignup, signup);
  router.post("/api/auth/login", validateLogin, login);
  router.post("/api/auth/refresh", validateRefreshToken, refreshToken);
  router.post("/api/auth/validate", validateToken);

  return router;
}
