import { Router } from "express";
import { listRestaurants, getRestaurantById, getRestaurantMenu, listKitchenOrders } from "../controllers/restaurants.controller.js";
import { addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability, validateMenuItemsForOrder } from "../controllers/menu.controller.js";
import { toggleRestaurantStatus, checkRestaurantStatus } from "../controllers/status.controller.js";

export default function restaurantsRoutes() {
  const router = Router();
  router.get("/api/restaurants", listRestaurants);
  router.get("/api/restaurants/:id", getRestaurantById);
  router.get("/api/restaurants/:id/menu", getRestaurantMenu);
  router.post("/api/restaurants/:restaurantId/menu", addMenuItem);
  router.put("/api/restaurants/:restaurantId/menu/:itemId", updateMenuItem);
  router.delete("/api/restaurants/:restaurantId/menu/:itemId", deleteMenuItem);
  router.put("/api/restaurants/:restaurantId/menu/:itemId/availability", toggleMenuItemAvailability);
  router.put("/api/restaurants/:restaurantId/status", toggleRestaurantStatus);
  router.get("/api/restaurants/:restaurantId/status", checkRestaurantStatus);
  router.post("/api/restaurants/:restaurantId/menu/validate", validateMenuItemsForOrder);
  router.get("/api/kitchen/orders", listKitchenOrders);
  return router;
}


