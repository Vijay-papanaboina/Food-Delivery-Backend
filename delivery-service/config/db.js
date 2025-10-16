import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { getDelivery, getDeliveryByOrderId, getDeliveries, upsertDelivery } from "../repositories/deliveries.repo.js";
import { getDriver, getDrivers, upsertDriver } from "../repositories/drivers.repo.js";

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

export async function getDeliveryStats() {
  const result = await db.execute(sql`
    SELECT 
      COUNT(*) as total_deliveries,
      COUNT(*) FILTER (WHERE status = 'assigned') as in_progress,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'pending_assignment') as pending,
      COUNT(DISTINCT driver_id) as total_drivers,
      COUNT(DISTINCT driver_id) FILTER (WHERE d.driver_id IN (
        SELECT driver_id FROM delivery_svc.drivers WHERE is_available = true
      )) as available_drivers,
      AVG(EXTRACT(EPOCH FROM (actual_delivery_time - assigned_at))/60) as avg_delivery_time_minutes
    FROM delivery_svc.deliveries d
    LEFT JOIN delivery_svc.drivers dr ON d.driver_id = dr.driver_id
  `);
  const stats = result.rows ? result.rows[0] : result[0];
  return {
    totalDeliveries: parseInt(stats.total_deliveries || 0),
    inProgressDeliveries: parseInt(stats.in_progress || 0),
    completedDeliveries: parseInt(stats.completed || 0),
    pendingDeliveries: parseInt(stats.pending || 0),
    totalDrivers: parseInt(stats.total_drivers || 0),
    availableDrivers: parseInt(stats.available_drivers || 0),
    averageDeliveryTimeMinutes: parseFloat(stats.avg_delivery_time_minutes || 0)
  };
}
