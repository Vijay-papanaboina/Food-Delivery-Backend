import { db } from "../config/db.js";
import { sql } from "drizzle-orm";
import { upsertMenuItem, getMenuItems } from "../repositories/menu.repo.js";
import { v4 as uuidv4 } from "uuid";

export const addMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, description, price, category, preparationTime } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: "Missing required fields: name, price, category" });
    }
    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    const menuItem = {
      itemId: uuidv4(),
      restaurantId,
      name,
      description: description || "",
      price,
      category,
      isAvailable: true,
      preparationTime: preparationTime || 15,
      createdAt: new Date().toISOString(),
    };

    await upsertMenuItem(menuItem);

    res.status(201).json({
      message: "Menu item added successfully",
      item: menuItem,
    });
  } catch (error) {
    console.error("Error adding menu item:", error.message);
    res.status(500).json({ error: "Failed to add menu item", details: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const updates = req.body;

    const result = await db.execute(sql`SELECT item_id, restaurant_id, name, description, price, category, is_available, preparation_time
       FROM restaurant_svc.menu_items WHERE item_id = ${itemId}`);
    const rows = result.rows || result;

    if (!rows[0] || rows[0].restaurant_id !== restaurantId) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const existingItem = {
      itemId: rows[0].item_id,
      restaurantId: rows[0].restaurant_id,
      name: rows[0].name,
      description: rows[0].description,
      price: parseFloat(rows[0].price),
      category: rows[0].category,
      isAvailable: rows[0].is_available,
      preparationTime: rows[0].preparation_time,
      createdAt: new Date().toISOString(),
    };

    const updatedItem = { ...existingItem, ...updates, itemId, restaurantId };
    await upsertMenuItem(updatedItem);

    res.json({ message: "Menu item updated successfully", item: updatedItem });
  } catch (error) {
    console.error("Error updating menu item:", error.message);
    res.status(500).json({ error: "Failed to update menu item", details: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    await db.execute(sql`DELETE FROM restaurant_svc.menu_items WHERE restaurant_id = ${restaurantId} AND item_id = ${itemId}`);
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error.message);
    res.status(500).json({ error: "Failed to delete menu item", details: error.message });
  }
};

export const toggleMenuItemAvailability = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ error: "isAvailable must be a boolean" });
    }
    await db.execute(sql`UPDATE restaurant_svc.menu_items SET is_available = ${isAvailable} WHERE restaurant_id = ${restaurantId} AND item_id = ${itemId}`);
    res.json({ message: `Menu item ${isAvailable ? "enabled" : "disabled"} successfully`, itemId, isAvailable });
  } catch (error) {
    console.error("Error toggling menu item availability:", error.message);
    res.status(500).json({ error: "Failed to toggle availability", details: error.message });
  }
};

export const validateMenuItemsForOrder = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items must be a non-empty array" });
    }
    const itemIds = items.map((i) => i.itemId);
    const result = await db.execute(sql`SELECT item_id, name, price, category, is_available FROM restaurant_svc.menu_items WHERE restaurant_id = ${restaurantId} AND item_id = ANY(${itemIds})`);
    const rows = result.rows || result;
    const map = new Map(rows.map((r) => [r.item_id, r]));
    const errors = [];
    const validated = [];
    for (const item of items) {
      const db = map.get(item.itemId);
      if (!db) {
        errors.push(`Item ${item.itemId} not found in restaurant menu`);
        continue;
      }
      if (!db.is_available) {
        errors.push(`Item ${db.name} is currently unavailable`);
        continue;
      }
      validated.push({
        itemId: item.itemId,
        name: db.name,
        price: parseFloat(db.price),
        quantity: item.quantity,
        category: db.category,
      });
    }
    res.json({ valid: errors.length === 0, errors, items: validated });
  } catch (error) {
    console.error("Error validating menu items:", error.message);
    res.status(500).json({ error: "Failed to validate menu items", details: error.message });
  }
};


