import {
  listRestaurantsService,
  getRestaurantByIdService,
  getMyRestaurantService,
  listKitchenOrdersService,
} from "../services/restaurant.service.js";
import {
  getRestaurantMenuService,
} from "../services/menu.service.js";
import { logger } from "../utils/logger.js";

export const listRestaurants = async (req, res) => {
  try {
    const restaurants = await listRestaurantsService(req.query);

    logger.info("Restaurants retrieved successfully", {
      count: restaurants.length,
    });

    res.json({
      message: "Restaurants retrieved successfully",
      restaurants,
      total: restaurants.length,
    });
  } catch (error) {
    logger.error("Failed to retrieve restaurants", {
      error: error.message,
      filters: req.query,
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
    const restaurant = await getRestaurantByIdService(id);
    res.json({ message: "Restaurant retrieved successfully", restaurant });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to retrieve restaurant", details: error.message });
  }
};

export const getMyRestaurant = async (req, res) => {
  try {
    const userId = req.user.userId;
    const restaurant = await getMyRestaurantService(userId);

    res.json({
      message: "Restaurant retrieved successfully",
      restaurant,
    });
  } catch (error) {
    logger.error("Failed to retrieve restaurant for user", {
      error: error.message,
      userId: req.user?.userId,
    });
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
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

    const menu = await getRestaurantMenuService(id, category, isAvailable);

    res.json({
      message: "Restaurant menu retrieved successfully",
      menu,
      total: menu.length,
    });
  } catch (error) {
    console.error(
      `❌ [restaurant-service] Error retrieving restaurant menu:`,
      error.message
    );
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
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

    const { orders, stats } = await listKitchenOrdersService(userId, status);

    res.json({
      message: "Kitchen orders retrieved successfully",
      orders,
      total: orders.length,
      stats,
    });
  } catch (error) {
    logger.error("Failed to retrieve kitchen orders", {
      error: error.message,
      userId: req.user?.userId,
    });
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Failed to retrieve kitchen orders",
      details: error.message,
    });
  }
};