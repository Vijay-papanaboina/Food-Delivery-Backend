import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import {
  getDelivery,
  getDeliveryByOrderId,
  getDeliveries,
  upsertDelivery,
  getDeliveryStats,
  getDriverStats,
} from "../repositories/deliveries.repo.js";
import {
  getDriver,
  getDrivers,
  upsertDriver,
} from "../repositories/drivers.repo.js";

export const db = drizzle(process.env.DATABASE_URL);

export async function initDb() {
  // Schemas/tables handled by migrations and compose init job
  console.log("[delivery-service] Drizzle DB initialized");
}

// Delivery functions
export { upsertDelivery };

export { getDelivery };

export { getDeliveryByOrderId };

export { getDeliveries };

// Driver functions
export { upsertDriver };

export { getDriver };

export { getDrivers };

export { getDeliveryStats };

export { getDriverStats };
