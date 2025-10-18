import { eq, and } from "drizzle-orm";
import { db } from "../config/db.js";
import { userCarts } from "../db/schema.js";

export const getCartByUserId = async (userId) => {
  const [cart] = await db
    .select()
    .from(userCarts)
    .where(eq(userCarts.userId, userId))
    .orderBy(userCarts.updatedAt);

  return cart;
};

export const upsertCart = async (cartData) => {
  const existingCart = await getCartByUserId(cartData.userId);

  if (existingCart) {
    // Update existing cart
    await db
      .update(userCarts)
      .set({
        restaurantId: cartData.restaurantId,
        items: cartData.items,
        subtotal: String(cartData.subtotal),
        deliveryFee: String(cartData.deliveryFee),
        total: String(cartData.total),
        updatedAt: new Date(),
      })
      .where(eq(userCarts.id, existingCart.id));

    return { ...existingCart, ...cartData };
  } else {
    // Create new cart
    const [newCart] = await db
      .insert(userCarts)
      .values({
        userId: cartData.userId,
        restaurantId: cartData.restaurantId,
        items: cartData.items,
        subtotal: String(cartData.subtotal),
        deliveryFee: String(cartData.deliveryFee),
        total: String(cartData.total),
      })
      .returning();

    return newCart;
  }
};

export const clearCart = async (userId) => {
  await db.delete(userCarts).where(eq(userCarts.userId, userId));
};

export const deleteCart = async (cartId) => {
  await db.delete(userCarts).where(eq(userCarts.id, cartId));
};
