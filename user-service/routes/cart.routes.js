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
    body("restaurantId")
      .isUUID()
      .withMessage("Restaurant ID must be a valid UUID"),
    body("items").isArray().withMessage("Items must be an array"),
    body("items.*.itemId").isUUID().withMessage("Item ID must be a valid UUID"),
    body("items.*.name")
      .isString()
      .notEmpty()
      .withMessage("Item name is required"),
    body("items.*.price")
      .isNumeric()
      .withMessage("Item price must be a number"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Item quantity must be at least 1"),
    body("subtotal").isNumeric().withMessage("Subtotal must be a number"),
    body("deliveryFee")
      .isNumeric()
      .withMessage("Delivery fee must be a number"),
    body("total").isNumeric().withMessage("Total must be a number"),
  ];

  // Protected cart routes
  router.get("/api/cart", authenticateToken, getCart);
  router.put("/api/cart", authenticateToken, validateCart, updateCart);
  router.delete("/api/cart", authenticateToken, clearUserCart);

  return router;
}
