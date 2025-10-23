import { Router } from "express";
import {
  listRestaurants,
  getRestaurantById,
  getMyRestaurant,
  getRestaurantMenu,
  listKitchenOrders,
} from "../controllers/restaurants.controller.js";
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  validateMenuItemsForOrder,
  getMenuItem,
} from "../controllers/menu.controller.js";
import {
  toggleRestaurantStatus,
  checkRestaurantStatus,
  markOrderAsReady,
} from "../controllers/status.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { requireRestaurantOwnership } from "../middleware/ownership.js";

export default function restaurantsRoutes(producer) {
  const router = Router();

  // Public routes (no authentication required)
  router.get("/restaurants", listRestaurants);

  // Protected routes for restaurant owners (must come before :id route)
  router.get(
    "/restaurants/my-restaurant",
    authenticateToken,
    requireRole("restaurant"),
    getMyRestaurant
  );

  // Public routes with parameters (must come after specific routes)
  router.get("/restaurants/:id", getRestaurantById);
  router.get("/restaurants/:id/menu", getRestaurantMenu);
  router.get("/menu-items/:itemId", getMenuItem);
  router.post(
    "/restaurants/:restaurantId/menu/validate",
    validateMenuItemsForOrder
  );

  // Protected restaurant-only routes (require restaurant role + ownership)
  router.post(
    "/restaurants/:restaurantId/menu",
    authenticateToken,
    requireRole("restaurant"),
    requireRestaurantOwnership,
    addMenuItem
  );
  router.put(
    "/restaurants/:restaurantId/menu/:itemId",
    authenticateToken,
    requireRole("restaurant"),
    requireRestaurantOwnership,
    updateMenuItem
  );
  router.delete(
    "/restaurants/:restaurantId/menu/:itemId",
    authenticateToken,
    requireRole("restaurant"),
    requireRestaurantOwnership,
    deleteMenuItem
  );
  router.put(
    "/restaurants/:restaurantId/menu/:itemId/availability",
    authenticateToken,
    requireRole("restaurant"),
    requireRestaurantOwnership,
    toggleMenuItemAvailability
  );
  router.put(
    "/restaurants/:restaurantId/status",
    authenticateToken,
    requireRole("restaurant"),
    requireRestaurantOwnership,
    toggleRestaurantStatus
  );
  router.get("/restaurants/:restaurantId/status", checkRestaurantStatus);

  // Kitchen orders (restaurant role only, no ownership check needed)
  router.get(
    "/kitchen/orders",
    authenticateToken,
    requireRole("restaurant"),
    listKitchenOrders
  );
  router.post(
    "/kitchen/orders/:orderId/ready",
    authenticateToken,
    requireRole("restaurant"),
    markOrderAsReady
  );

  return router;
}
