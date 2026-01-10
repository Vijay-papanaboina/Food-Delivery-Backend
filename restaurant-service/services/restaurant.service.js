import {
  getRestaurants,
  getRestaurant,
  getRestaurantByOwner,
  getRestaurantStats,
  toggleRestaurantStatus as toggleRestaurantStatusRepo,
  getRestaurantStatus,
} from "../repositories/restaurants.repo.js";
import {
  getKitchenOrder,
  getKitchenOrders,
} from "../repositories/kitchen.repo.js";
import { transformKitchenOrder, transformRestaurant } from "../utils/dataTransformation.js";
import { markOrderReady } from "../handlers/restaurant.handlers.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";

export const listRestaurantsService = async (filters) => {
  logger.info("Getting restaurants", { filters });
  
  const queryFilters = {};
  if (filters.search) queryFilters.search = filters.search;
  if (filters.cuisine) queryFilters.cuisine = filters.cuisine;
  if (filters.isActive !== undefined) queryFilters.isActive = filters.isActive === "true";
  if (filters.minRating) queryFilters.minRating = filters.minRating;
  
  const rawRestaurants = await getRestaurants(queryFilters);
  return rawRestaurants.map(transformRestaurant);
};

export const getRestaurantByIdService = async (id) => {
  const restaurant = await getRestaurant(id);
  if (!restaurant) {
    const error = new Error("Restaurant not found");
    error.statusCode = 404;
    throw error;
  }
  return transformRestaurant(restaurant);
};

export const getMyRestaurantService = async (userId) => {
  logger.info("Getting restaurant for user", { userId });

  const restaurant = await getRestaurantByOwner(userId);
  if (!restaurant) {
    const error = new Error("No restaurant found for this user");
    error.statusCode = 404;
    throw error;
  }

  logger.info("Restaurant retrieved successfully", {
    userId,
    restaurantId: restaurant._id,
  });

  return transformRestaurant(restaurant);
};

export const listKitchenOrdersService = async (userId, status) => {
  // Get restaurant for the authenticated user
  const restaurant = await getRestaurantByOwner(userId);
  if (!restaurant) {
    const error = new Error("No restaurant found for this user");
    error.statusCode = 404;
    throw error;
  }

  const filters = { restaurantId: new mongoose.Types.ObjectId(restaurant.id) };
  if (status) filters.status = status;

  logger.info("Getting kitchen orders", {
    userId,
    restaurantId: restaurant.id,
    filters,
  });

  let orders = await getKitchenOrders(filters);
  orders = orders.map(transformKitchenOrder);

  const stats = await getRestaurantStats();

  logger.info("Kitchen orders retrieved successfully", {
    userId,
    restaurantId: restaurant.id,
    orderCount: orders.length,
  });

  return { orders, stats: stats.kitchenOrders };
};

export const toggleRestaurantStatusService = async (restaurantId, isOpen) => {
  if (typeof isOpen !== "boolean") {
    const error = new Error("isOpen must be a boolean");
    error.statusCode = 400;
    throw error;
  }
  await toggleRestaurantStatusRepo(restaurantId, isOpen);
  return { restaurantId, isOpen };
};

export const checkRestaurantStatusService = async (restaurantId) => {
  const r = await getRestaurantStatus(restaurantId);
  if (!r) {
    const error = new Error("Restaurant not found");
    error.statusCode = 404;
    throw error;
  }
  
  let reason = "Restaurant is open";
  let open = r.isOpen && r.isActive;
  if (!open) {
    reason = !r.isActive
      ? "Restaurant is inactive"
      : "Restaurant is temporarily closed";
  }
  
  return { restaurantId, isOpen: open, reason };
};

export const markOrderAsReadyService = async (orderId, userId, producer) => {
  if (!orderId || typeof orderId !== "string") {
    const error = new Error("Invalid orderId: must be a non-empty string");
    error.statusCode = 400;
    throw error;
  }

  // Check ownership
  const restaurant = await getRestaurantByOwner(userId);
  if (!restaurant) {
     const error = new Error("Unauthorized: You do not own a restaurant");
     error.statusCode = 403;
     throw error;
  }
  
  const order = await getKitchenOrder(new mongoose.Types.ObjectId(orderId));
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }
  
  if (order.restaurantId.toString() !== restaurant.id) {
    const error = new Error("Unauthorized: You do not own this order");
    error.statusCode = 403;
    throw error;
  }

  await markOrderReady(orderId, producer, "restaurant-service");
  
  return {
    orderId,
    readyAt: new Date().toISOString(),
  };
};
