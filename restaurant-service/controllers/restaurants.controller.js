import {
  getRestaurants,
  getRestaurant,
  getRestaurantByOwner,
  getRestaurantStats,
} from "../repositories/restaurants.repo.js";
import { getMenuItems } from "../repositories/menu.repo.js";
import { logger } from "../utils/logger.js";
import {
  getKitchenOrders,
  upsertKitchenOrder,
} from "../repositories/kitchen.repo.js";

export const listRestaurants = async (req, res) => {
  try {
    const { cuisine, isActive, minRating } = req.query;

    logger.info("Getting restaurants", {
      filters: { cuisine, isActive, minRating },
    });
    const filters = {};
    if (cuisine) filters.cuisine = cuisine;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (minRating) filters.minRating = minRating;
    const restaurants = await getRestaurants(filters);

    logger.info("Restaurants retrieved successfully", {
      count: restaurants.length,
      filters,
    });

    res.json({
      message: "Restaurants retrieved successfully",
      restaurants,
      total: restaurants.length,
    });
  } catch (error) {
    logger.error("Failed to retrieve restaurants", {
      error: error.message,
      stack: error.stack,
      filters,
    });
    res.status(500).json({
      error: "Failed to retrieve restaurants",
      details: error.message,
    });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await getRestaurant(id);
    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });
    res.json({ message: "Restaurant retrieved successfully", restaurant });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve restaurant", details: error.message });
  }
};

export const getMyRestaurant = async (req, res) => {
  try {
    const userId = req.user.userId;

    logger.info("Getting restaurant for user", { userId });

    const restaurant = await getRestaurantByOwner(userId);
    if (!restaurant) {
      logger.warn("No restaurant found for user", { userId });
      return res
        .status(404)
        .json({ error: "No restaurant found for this user" });
    }

    logger.info("Restaurant retrieved successfully", {
      userId,
      restaurantId: restaurant.restaurant_id,
    });

    res.json({
      message: "Restaurant retrieved successfully",
      restaurant,
    });
  } catch (error) {
    logger.error("Failed to retrieve restaurant for user", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      error: "Failed to retrieve restaurant",
      details: error.message,
    });
  }
};

export const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, isAvailable } = req.query;

    // Validate restaurant ID
    if (!id || typeof id !== "string") {
      return res
        .status(400)
        .json({ error: "Invalid restaurant ID: must be a non-empty string" });
    }

    const restaurant = await getRestaurant(id);
    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });

    const filters = {};
    if (category) {
      if (typeof category !== "string") {
        return res.status(400).json({ error: "Category must be a string" });
      }
      filters.category = category;
    }
    if (isAvailable !== undefined) {
      if (isAvailable !== "true" && isAvailable !== "false") {
        return res
          .status(400)
          .json({ error: "isAvailable must be 'true' or 'false'" });
      }
      filters.isAvailable = isAvailable === "true";
    }

    const menu = await getMenuItems(id, filters);

    // Transform menu items to camelCase for API response
    const transformedMenu = menu.map((item) => ({
      itemId: item.item_id,
      restaurantId: item.restaurant_id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      category: item.category,
      isAvailable: item.is_available,
      preparationTime: item.preparation_time,
      imageUrl: item.image_url,
      createdAt: item.created_at,
    }));

    res.json({
      message: "Restaurant menu retrieved successfully",
      menu: transformedMenu,
      total: transformedMenu.length,
    });
  } catch (error) {
    console.error(
      `❌ [restaurant-service] Error retrieving restaurant menu:`,
      error.message
    );
    res.status(500).json({
      error: "Failed to retrieve restaurant menu",
      details: error.message,
    });
  }
};

export const listKitchenOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.userId;

    // Get restaurant for the authenticated user
    const restaurant = await getRestaurantByOwner(userId);
    if (!restaurant) {
      logger.warn("No restaurant found for user", { userId });
      return res
        .status(404)
        .json({ error: "No restaurant found for this user" });
    }

    const filters = { restaurantId: restaurant.restaurant_id };
    if (status) filters.status = status;

    logger.info("Getting kitchen orders", {
      userId,
      restaurantId: restaurant.restaurant_id,
      filters,
    });

    const orders = await getKitchenOrders(filters);
    const stats = await getRestaurantStats();

    logger.info("Kitchen orders retrieved successfully", {
      userId,
      restaurantId: restaurant.restaurant_id,
      orderCount: orders.length,
    });

    res.json({
      message: "Kitchen orders retrieved successfully",
      orders,
      total: orders.length,
      stats: stats.kitchenOrders,
    });
  } catch (error) {
    logger.error("Failed to retrieve kitchen orders", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      error: "Failed to retrieve kitchen orders",
      details: error.message,
    });
  }
};
