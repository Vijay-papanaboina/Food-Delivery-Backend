import { Router } from "express";
import rateLimit from "express-rate-limit";
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

  // Auth rate limiter - stricter limits for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30, // limit each IP to 10 auth requests per windowMs
    message: "Too many authentication attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Public auth routes with rate limiting
  router.post("/api/auth/signup", authLimiter, validateSignup, signup);
  router.post("/api/auth/login", authLimiter, validateLogin, login);
  router.post(
    "/api/auth/refresh",
    authLimiter,
    validateRefreshToken,
    refreshToken
  );
  router.post("/api/auth/validate", authLimiter, validateToken);

  return router;
}
