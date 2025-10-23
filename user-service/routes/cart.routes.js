import { Router } from "express";
import {
  getCart,
  updateCart,
  clearUserCart,
} from "../controllers/cart.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
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

  // Protected cart routes (customer role only)
  router.get("/cart", authenticateToken, requireRole("customer"), getCart);
  router.put(
    "/cart",
    authenticateToken,
    requireRole("customer"),
    validateCart,
    updateCart
  );
  router.delete(
    "/cart",
    authenticateToken,
    requireRole("customer"),
    clearUserCart
  );

  return router;
}
