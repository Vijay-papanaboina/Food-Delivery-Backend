import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  login,
  refreshToken,
  validateToken,
  logout,
} from "../controllers/auth.controller.js";
import {
  validateSignup,
  validateLogin,
  validateRefreshToken,
} from "../middleware/validation.js";
import { authenticateToken } from "../middleware/auth.js";

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
  router.post("/auth/signup", authLimiter, validateSignup, signup);
  router.post("/auth/login/:role", authLimiter, validateLogin, login);
  router.post("/auth/refresh", authLimiter, validateRefreshToken, refreshToken);
  router.post("/auth/validate", authLimiter, authenticateToken, validateToken);
  router.post("/auth/logout", authLimiter, authenticateToken, logout);

  return router;
}
