import { User } from "../db/schema.js";

// Get all cart items for a user
export const getCartItemsByUserId = async (userId) => {
  const user = await User.findById(userId).select("cart");
  if (!user) return [];
  
  return user.cart;
};

// Add or update a cart item (upsert)
export const upsertCartItem = async (userId, itemId, quantity) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  // Find existing cart item (compare ObjectId as string)
  const existingItem = user.cart.find((item) => item.itemId.toString() === itemId);
  
  if (existingItem) {
    // Update existing item
    existingItem.quantity = quantity;
  } else {
    // Add new item
    user.cart.push({ itemId, quantity });
  }
  
  await user.save();
  
  // Return the updated/created item
  return user.cart.find((item) => item.itemId.toString() === itemId).toObject();
};

// Remove a specific item from cart
export const removeCartItem = async (userId, itemId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  user.cart = user.cart.filter((item) => item.itemId.toString() !== itemId);
  await user.save();
};

// Clear all cart items for a user
export const clearCartByUserId = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  user.cart = [];
  await user.save();
};
