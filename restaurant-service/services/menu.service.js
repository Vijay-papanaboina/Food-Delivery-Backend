import {
  upsertMenuItem,
  getMenuItems,
  getMenuItemById,
  deleteMenuItemRow,
  setMenuItemAvailability,
  getMenuItemsByIds,
} from "../repositories/menu.repo.js";
import { transformMenuItem } from "../utils/dataTransformation.js";
import { getRestaurant } from "../repositories/restaurants.repo.js";
import { logger } from "../utils/logger.js";

export const addMenuItemService = async (restaurantId, itemData) => {
  const { name, description, price, category, preparationTime } = itemData;

  if (!name || price === undefined || !category) {
    const error = new Error("Missing required fields: name, price, category");
    error.statusCode = 400;
    throw error;
  }
  if (typeof price !== "number" || price <= 0) {
    const error = new Error("Price must be a positive number");
    error.statusCode = 400;
    throw error;
  }

  const menuItem = {
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

  return {
    ...createdMenuItem,
    itemId: createdMenuItem._id,
  };
};

export const updateMenuItemService = async (restaurantId, itemId, updates) => {
  const row = await getMenuItemById(itemId);
  
  if (!row || row.restaurantId.toString() !== restaurantId) {
    const error = new Error("Menu item not found");
    error.statusCode = 404;
    throw error;
  }

  const existingItem = {
    itemId: row._id,
    restaurantId: row.restaurantId,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    category: row.category,
    isAvailable: row.isAvailable,
    preparationTime: row.preparationTime,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt,
  };

  const updatedItemData = { ...existingItem, ...updates, itemId, restaurantId };
  const updatedItem = await upsertMenuItem(updatedItemData);

  return {
    ...updatedItem,
    itemId: updatedItem._id,
  };
};

export const deleteMenuItemService = async (restaurantId, itemId) => {
  await deleteMenuItemRow(restaurantId, itemId);
};

export const toggleMenuItemAvailabilityService = async (restaurantId, itemId, isAvailable) => {
  if (typeof isAvailable !== "boolean") {
    const error = new Error("isAvailable must be a boolean");
    error.statusCode = 400;
    throw error;
  }
  await setMenuItemAvailability(restaurantId, itemId, isAvailable);
  return { itemId, isAvailable };
};

export const getMenuItemService = async (itemId) => {
  if (!itemId || typeof itemId !== "string") {
    const error = new Error("Invalid item ID: must be a non-empty string");
    error.statusCode = 400;
    throw error;
  }

  const row = await getMenuItemById(itemId);
  if (!row) {
    const error = new Error("Menu item not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    itemId: row._id,
    restaurantId: row.restaurantId,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    category: row.category,
    isAvailable: row.isAvailable,
    preparationTime: row.preparationTime,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt,
  };
};

export const getRestaurantMenuService = async (restaurantId, category, isAvailable) => {
  // Validate restaurant ID
  if (!restaurantId || typeof restaurantId !== "string") {
    const error = new Error("Invalid restaurant ID: must be a non-empty string");
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await getRestaurant(restaurantId);
  if (!restaurant) {
    const error = new Error("Restaurant not found");
    error.statusCode = 404;
    throw error;
  }

  const filters = {};
  if (category) {
    if (typeof category !== "string") {
      const error = new Error("Category must be a string");
      error.statusCode = 400;
      throw error;
    }
    filters.category = category;
  }
  if (isAvailable !== undefined) {
    if (isAvailable !== "true" && isAvailable !== "false") {
      const error = new Error("isAvailable must be 'true' or 'false'");
      error.statusCode = 400;
      throw error;
    }
    filters.isAvailable = isAvailable === "true";
  }

  const menu = await getMenuItems(restaurantId, filters);
  return menu.map(transformMenuItem);
};

export const validateMenuItemsService = async (restaurantId, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Items must be a non-empty array");
    error.statusCode = 400;
    throw error;
  }
  const itemIds = items.map((i) => i.itemId);

  const rows = await getMenuItemsByIds(restaurantId, itemIds);
  
  const map = new Map(rows.map((r) => {
    if (!r || !r.id) { 
      throw new Error(`Invalid item returned from database for ID: ${r?.id || 'unknown'}`);
    }
    return [r.id.toString(), r];
  }));
  
  const errors = [];
  const validated = [];
  
  for (const item of items) {
    const db = map.get(item.itemId);
    if (!db) {
      errors.push(`Item ${item.itemId} not found in restaurant menu`);
      continue;
    }
    if (!db.isAvailable) {
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
  
  return { valid: errors.length === 0, errors, items: validated };
};
