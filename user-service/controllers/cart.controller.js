import { validationResult } from "express-validator";
import {
  getCartByUserId,
  upsertCart,
  clearCart,
} from "../repositories/cart.repo.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await getCartByUserId(userId);

    if (!cart) {
      return res.json({
        message: "Cart retrieved successfully",
        cart: {
          items: [],
          restaurantId: null,
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
        },
      });
    }

    // Parse JSON fields
    const cartData = {
      id: cart.id,
      userId: cart.userId,
      restaurantId: cart.restaurantId,
      items:
        typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items,
      subtotal: parseFloat(cart.subtotal),
      deliveryFee: parseFloat(cart.deliveryFee),
      total: parseFloat(cart.total),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };

    res.json({
      message: "Cart retrieved successfully",
      cart: cartData,
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
    const { restaurantId, items, subtotal, deliveryFee, total } = req.body;

    const cartData = {
      userId,
      restaurantId,
      items,
      subtotal,
      deliveryFee,
      total,
    };

    const cart = await upsertCart(cartData);

    res.json({
      message: "Cart updated successfully",
      cart: {
        id: cart.id,
        userId: cart.userId,
        restaurantId: cart.restaurantId,
        items:
          typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items,
        subtotal: parseFloat(cart.subtotal),
        deliveryFee: parseFloat(cart.deliveryFee),
        total: parseFloat(cart.total),
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
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
    await clearCart(userId);

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
