import { initializeSampleRestaurants } from "../handlers/restaurant.handlers.js";

/**
 * Initialize sample data for the restaurant service
 */
export async function initializeSampleData() {
  await initializeSampleRestaurants();
}
