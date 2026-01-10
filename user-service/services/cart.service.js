import {
  getCartItemsByUserId,
  upsertCartItem,
  clearCartByUserId,
} from "../repositories/cart.repo.js";
import { logger } from "../utils/logger.js";

export const getCartService = async (userId) => {
  logger.info("Getting user cart", { userId });

  const items = await getCartItemsByUserId(userId);

  return items.map((item) => ({
    id: item.id,
    itemId: item.itemId,
    quantity: item.quantity,
  }));
};

export const updateCartService = async (userId, items) => {
  // Clear existing cart
  await clearCartByUserId(userId);

  // Insert new items
  for (const item of items) {
    await upsertCartItem(userId, item.itemId, item.quantity);
  }

  return { message: "Cart updated successfully" };
};

export const clearCartService = async (userId) => {
  await clearCartByUserId(userId);
  return { message: "Cart cleared successfully" };
};
