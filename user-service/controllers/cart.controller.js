import { validationResult } from "express-validator";
import {
  getCartService,
  updateCartService,
  clearCartService,
} from "../services/cart.service.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await getCartService(userId);

    res.json({
      message: "Cart retrieved successfully",
      items,
    });
  } catch (error) {
    console.error("Error getting cart:", error.message);
    res.status(500).json({
      error: "Failed to get cart",
      details: error.message,
    });
  }
};

export const updateCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const userId = req.user.userId;
    const { items } = req.body;

    const result = await updateCartService(userId, items);

    res.json(result);
  } catch (error) {
    console.error("Error updating cart:", error.message);
    res.status(500).json({
      error: "Failed to update cart",
      details: error.message,
    });
  }
};

export const clearUserCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await clearCartService(userId);

    res.json(result);
  } catch (error) {
    console.error("Error clearing cart:", error.message);
    res.status(500).json({
      error: "Failed to clear cart",
      details: error.message,
    });
  }
};