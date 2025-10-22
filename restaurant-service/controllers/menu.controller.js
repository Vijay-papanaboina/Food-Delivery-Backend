import {
  upsertMenuItem,
  getMenuItems,
  getMenuItemById,
  deleteMenuItemRow,
  setMenuItemAvailability,
  getMenuItemsByIds,
} from "../repositories/menu.repo.js";
// Removed uuid import - using database-generated IDs now

export const addMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, description, price, category, preparationTime } = req.body;

    if (!name || price === undefined || !category) {
      return res
        .status(400)
        .json({ error: "Missing required fields: name, price, category" });
    }
    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    const menuItem = {
      // Don't provide itemId - let database generate it
      restaurantId,
      name,
      description: description || "",
      price,
      category,
      isAvailable: true,
      preparationTime: preparationTime || 15,
      createdAt: new Date().toISOString(),
    };

    const createdMenuItem = await upsertMenuItem(menuItem);

    res.status(201).json({
      message: "Menu item added successfully",
      item: createdMenuItem,
    });
  } catch (error) {
    console.error("Error adding menu item:", error.message);
    res
      .status(500)
      .json({ error: "Failed to add menu item", details: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const updates = req.body;

    const row = await getMenuItemById(itemId);
    if (!row || row.restaurant_id !== restaurantId) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const existingItem = {
      itemId: row.item_id,
      restaurantId: row.restaurant_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      category: row.category,
      isAvailable: row.is_available,
      preparationTime: row.preparation_time,
      imageUrl: row.image_url,
      createdAt: new Date().toISOString(),
    };

    const updatedItem = { ...existingItem, ...updates, itemId, restaurantId };
    await upsertMenuItem(updatedItem);

    res.json({ message: "Menu item updated successfully", item: updatedItem });
  } catch (error) {
    console.error("Error updating menu item:", error.message);
    res
      .status(500)
      .json({ error: "Failed to update menu item", details: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    await deleteMenuItemRow(restaurantId, itemId);
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error.message);
    res
      .status(500)
      .json({ error: "Failed to delete menu item", details: error.message });
  }
};

export const toggleMenuItemAvailability = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ error: "isAvailable must be a boolean" });
    }
    await setMenuItemAvailability(restaurantId, itemId, isAvailable);
    res.json({
      message: `Menu item ${isAvailable ? "enabled" : "disabled"} successfully`,
      itemId,
      isAvailable,
    });
  } catch (error) {
    console.error("Error toggling menu item availability:", error.message);
    res
      .status(500)
      .json({ error: "Failed to toggle availability", details: error.message });
  }
};

export const getMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId || typeof itemId !== "string") {
      return res
        .status(400)
        .json({ error: "Invalid item ID: must be a non-empty string" });
    }

    const row = await getMenuItemById(itemId);
    if (!row) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Transform to camelCase for API response
    const item = {
      itemId: row.item_id,
      restaurantId: row.restaurant_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      category: row.category,
      isAvailable: row.is_available,
      preparationTime: row.preparation_time,
      imageUrl: row.image_url,
      createdAt: row.created_at,
    };

    res.json({
      message: "Menu item retrieved successfully",
      item,
    });
  } catch (error) {
    console.error("Error getting menu item:", error.message);
    res
      .status(500)
      .json({ error: "Failed to get menu item", details: error.message });
  }
};

export const validateMenuItemsForOrder = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items must be a non-empty array" });
    }
    const itemIds = items.map((i) => i.id);
    const rows = await getMenuItemsByIds(restaurantId, itemIds);
    const map = new Map(rows.map((r) => [r.item_id, r]));
    const errors = [];
    const validated = [];
    for (const item of items) {
      const db = map.get(item.id);
      if (!db) {
        errors.push(`Item ${item.id} not found in restaurant menu`);
        continue;
      }
      if (!db.is_available) {
        errors.push(`Item ${db.name} is currently unavailable`);
        continue;
      }
      validated.push({
        itemId: item.id,
        name: db.name,
        price: parseFloat(db.price),
        quantity: item.quantity,
        category: db.category,
      });
    }
    res.json({ valid: errors.length === 0, errors, items: validated });
  } catch (error) {
    console.error("Error validating menu items:", error.message);
    res
      .status(500)
      .json({ error: "Failed to validate menu items", details: error.message });
  }
};
