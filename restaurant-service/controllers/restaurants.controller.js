import { getRestaurants, getRestaurant, getRestaurantStats } from "../repositories/restaurants.repo.js";
import { getMenuItems } from "../repositories/menu.repo.js";
import { getKitchenOrders, upsertKitchenOrder } from "../repositories/kitchen.repo.js";

export const listRestaurants = async (req, res) => {
  try {
    const { cuisine, isActive, minRating } = req.query;
    const filters = {};
    if (cuisine) filters.cuisine = cuisine;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (minRating) filters.minRating = minRating;
    const restaurants = await getRestaurants(filters);
    res.json({ message: "Restaurants retrieved successfully", restaurants, total: restaurants.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve restaurants", details: error.message });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await getRestaurant(id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    res.json({ message: "Restaurant retrieved successfully", restaurant });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve restaurant", details: error.message });
  }
};

export const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, isAvailable } = req.query;
    
    // Validate restaurant ID
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid restaurant ID: must be a non-empty string" });
    }
    
    const restaurant = await getRestaurant(id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    
    const filters = {};
    if (category) {
      if (typeof category !== 'string') {
        return res.status(400).json({ error: "Category must be a string" });
      }
      filters.category = category;
    }
    if (isAvailable !== undefined) {
      if (isAvailable !== 'true' && isAvailable !== 'false') {
        return res.status(400).json({ error: "isAvailable must be 'true' or 'false'" });
      }
      filters.isAvailable = isAvailable === "true";
    }
    
    const menu = await getMenuItems(id, filters);
    
    // Transform menu items to camelCase for API response
    const transformedMenu = menu.map(item => ({
      itemId: item.item_id,
      restaurantId: item.restaurant_id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      category: item.category,
      isAvailable: item.is_available,
      preparationTime: item.preparation_time,
      createdAt: item.created_at
    }));
    
    res.json({ message: "Restaurant menu retrieved successfully", menu: transformedMenu, total: transformedMenu.length });
  } catch (error) {
    console.error(`❌ [restaurant-service] Error retrieving restaurant menu:`, error.message);
    res.status(500).json({ error: "Failed to retrieve restaurant menu", details: error.message });
  }
};

export const listKitchenOrders = async (req, res) => {
  try {
    const { status, restaurantId } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (restaurantId) filters.restaurantId = restaurantId;
    const orders = await getKitchenOrders(filters);
    const stats = await getRestaurantStats();
    res.json({ message: "Kitchen orders retrieved successfully", orders, total: orders.length, stats: stats.kitchenOrders });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve kitchen orders", details: error.message });
  }
};


