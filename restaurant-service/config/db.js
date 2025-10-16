import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { getRestaurant, getRestaurants, upsertRestaurant } from "../repositories/restaurants.repo.js";
import { getMenuItems, upsertMenuItem } from "../repositories/menu.repo.js";
import { getKitchenOrder, getKitchenOrders, upsertKitchenOrder } from "../repositories/kitchen.repo.js";
import { sql } from "drizzle-orm";

export const db = drizzle(process.env.DATABASE_URL);

export async function initDb() {
  console.log("[restaurant-service] Drizzle DB initialized");
}

export { upsertRestaurant, getRestaurant, getRestaurants };
export { upsertMenuItem, getMenuItems };
export { upsertKitchenOrder, getKitchenOrder, getKitchenOrders };

export async function getRestaurantStats() {
  const statsRows = await db.execute(sql`
    SELECT 
      COUNT(*) as total_restaurants,
      COUNT(*) FILTER (WHERE is_active = true) as active_restaurants,
      AVG(rating) as average_rating
    FROM restaurant_svc.restaurants
  `);
  const stats = statsRows.rows ? statsRows.rows[0] : statsRows[0];
  const cuisineRows = await db.execute(sql`
    SELECT cuisine, COUNT(*) as count
    FROM restaurant_svc.restaurants
    GROUP BY cuisine
    ORDER BY count DESC
  `);
  const categoryRows = await db.execute(sql`
    SELECT category, COUNT(*) as count
    FROM restaurant_svc.menu_items
    GROUP BY category
    ORDER BY count DESC
  `);
  const kitchenRows = await db.execute(sql`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status = 'received') as received,
      COUNT(*) FILTER (WHERE status = 'preparing') as preparing,
      COUNT(*) FILTER (WHERE status = 'ready') as ready,
      AVG(preparation_time) as avg_preparation_time
    FROM restaurant_svc.kitchen_orders
  `);
  const kitchenStats = kitchenRows.rows ? kitchenRows.rows[0] : kitchenRows[0];
  return {
    totalRestaurants: parseInt(stats.total_restaurants || 0),
    activeRestaurants: parseInt(stats.active_restaurants || 0),
    averageRating: parseFloat(stats.average_rating || 0).toFixed(2),
    byCuisine: Object.fromEntries((cuisineRows.rows || cuisineRows).map(row => [row.cuisine, parseInt(row.count)])),
    byCategory: Object.fromEntries((categoryRows.rows || categoryRows).map(row => [row.category, parseInt(row.count)])),
    kitchenOrders: {
      total: parseInt(kitchenStats.total_orders || 0),
      received: parseInt(kitchenStats.received || 0),
      preparing: parseInt(kitchenStats.preparing || 0),
      ready: parseInt(kitchenStats.ready || 0),
      averagePreparationTime: parseFloat(kitchenStats.avg_preparation_time || 0).toFixed(1)
    }
  };
}


