import { Router } from "express";
import {
  getCart,
  updateCart,
  clearUserCart,
} from "../controllers/cart.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { body } from "express-validator";

export default function cartRoutes(serviceName) {
  const router = Router();

  // Cart validation middleware
  const validateCart = [
    body("items").isArray().withMessage("Items must be an array"),
    body("items.*.itemId").isUUID().withMessage("Item ID must be a valid UUID"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Item quantity must be at least 1"),
  ];

  // Protected cart routes
  router.get("/api/cart", authenticateToken, getCart);
  router.put("/api/cart", authenticateToken, validateCart, updateCart);
  router.delete("/api/cart", authenticateToken, clearUserCart);

  return router;
}
