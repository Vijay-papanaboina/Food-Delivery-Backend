import { validationResult } from "express-validator";
import {
  getCartItemsByUserId,
  upsertCartItem,
  clearCartByUserId,
} from "../repositories/cart.repo.js";
import { logger } from "../utils/logger.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    logger.info("Getting user cart", { userId });

    const items = await getCartItemsByUserId(userId);

    res.json({
      message: "Cart retrieved successfully",
      items: items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
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
      console.log("Cart validation errors:", errors.array());
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const userId = req.user.userId;
    const { items } = req.body;

    // Clear existing cart
    await clearCartByUserId(userId);

    // Insert new items
    for (const item of items) {
      await upsertCartItem(userId, item.itemId, item.quantity);
    }

    res.json({ message: "Cart updated successfully" });
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
    await clearCartByUserId(userId);

    res.json({
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing cart:", error.message);
    res.status(500).json({
      error: "Failed to clear cart",
      details: error.message,
    });
  }
};
