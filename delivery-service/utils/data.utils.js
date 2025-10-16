import { initializeSampleDrivers } from "../handlers/delivery.handlers.js";

/**
 * Initialize sample data for the delivery service
 */
export async function initializeSampleData() {
  await initializeSampleDrivers();
}
