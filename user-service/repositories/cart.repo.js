import { eq, and } from "drizzle-orm";
import { db } from "../config/db.js";
import { cartItems } from "../db/schema.js";

// Get all cart items for a user
export const getCartItemsByUserId = async (userId) => {
  return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
};

// Add or update a cart item (upsert)
export const upsertCartItem = async (userId, itemId, quantity) => {
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.itemId, itemId)));

  if (existing.length > 0) {
    return await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, existing[0].id))
      .returning();
  } else {
    return await db
      .insert(cartItems)
      .values({ userId, itemId, quantity })
      .returning();
  }
};

// Remove a specific item from cart
export const removeCartItem = async (userId, itemId) => {
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.itemId, itemId)));
};

// Clear all cart items for a user
export const clearCartByUserId = async (userId) => {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
};
