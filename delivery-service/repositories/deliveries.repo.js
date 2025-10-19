import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { deliveries, drivers } from "../db/schema.js";

export async function upsertDelivery(d) {
  const [result] = await db
    .insert(deliveries)
    .values({
      deliveryId: d.id,
      orderId: d.orderId,
      driverId: d.driverId,
      driverName: d.driverName,
      driverPhone: d.driverPhone,
      vehicle: d.vehicle,
      licensePlate: d.licensePlate,
      deliveryAddress: d.deliveryAddress,
      status: d.status,
      assignedAt: d.assignedAt ? new Date(d.assignedAt) : null,
      estimatedDeliveryTime: d.estimatedDeliveryTime
        ? new Date(d.estimatedDeliveryTime)
        : null,
      actualDeliveryTime: d.actualDeliveryTime
        ? new Date(d.actualDeliveryTime)
        : null,
      createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
    })
    .onConflictDoUpdate({
      target: deliveries.id,
      set: {
        status: sql`excluded.status`,
        assignedAt: sql`excluded.assigned_at`,
        estimatedDeliveryTime: sql`excluded.estimated_delivery_time`,
        actualDeliveryTime: sql`excluded.actual_delivery_time`,
      },
    })
    .returning();

  return result;
}

// Update only selected fields on an existing delivery row
export async function updateDeliveryFields(deliveryId, fields) {
  const updateSet = {};
  if (fields.status !== undefined) updateSet.status = fields.status;
  if (fields.assignedAt !== undefined)
    updateSet.assignedAt = fields.assignedAt
      ? new Date(fields.assignedAt)
      : null;
  if (fields.estimatedDeliveryTime !== undefined)
    updateSet.estimatedDeliveryTime = fields.estimatedDeliveryTime
      ? new Date(fields.estimatedDeliveryTime)
      : null;
  if (fields.actualDeliveryTime !== undefined)
    updateSet.actualDeliveryTime = fields.actualDeliveryTime
      ? new Date(fields.actualDeliveryTime)
      : null;

  if (Object.keys(updateSet).length === 0) return;

  await db
    .update(deliveries)
    .set(updateSet)
    .where(eq(deliveries.id, deliveryId));
}

export async function getDelivery(deliveryId) {
  const rows = await db
    .select({
      delivery_id: deliveries.id,
      order_id: deliveries.orderId,
      driver_id: deliveries.driverId,
      driver_name: deliveries.driverName,
      driver_phone: deliveries.driverPhone,
      vehicle: deliveries.vehicle,
      license_plate: deliveries.licensePlate,
      delivery_address_json: deliveries.deliveryAddress,
      status: deliveries.status,
      assigned_at: deliveries.assignedAt,
      estimated_delivery_time: deliveries.estimatedDeliveryTime,
      actual_delivery_time: deliveries.actualDeliveryTime,
      created_at: deliveries.createdAt,
    })
    .from(deliveries)
    .where(eq(deliveries.id, deliveryId))
    .limit(1);
  if (!rows[0]) return null;
  const delivery = rows[0];
  return {
    deliveryId: delivery.delivery_id,
    orderId: delivery.order_id,
    driverId: delivery.driver_id,
    driverName: delivery.driver_name,
    driverPhone: delivery.driver_phone,
    vehicle: delivery.vehicle,
    licensePlate: delivery.license_plate,
    deliveryAddress:
      typeof delivery.delivery_address_json === "string"
        ? JSON.parse(delivery.delivery_address_json)
        : delivery.delivery_address_json,
    status: delivery.status,
    assignedAt: delivery.assigned_at,
    estimatedDeliveryTime: delivery.estimated_delivery_time,
    actualDeliveryTime: delivery.actual_delivery_time,
    createdAt: delivery.created_at,
  };
}

export async function getDeliveryByOrderId(orderId) {
  const rows = await db
    .select({
      delivery_id: deliveries.id,
      order_id: deliveries.orderId,
      driver_id: deliveries.driverId,
      driver_name: deliveries.driverName,
      driver_phone: deliveries.driverPhone,
      vehicle: deliveries.vehicle,
      license_plate: deliveries.licensePlate,
      delivery_address_json: deliveries.deliveryAddress,
      status: deliveries.status,
      assigned_at: deliveries.assignedAt,
      estimated_delivery_time: deliveries.estimatedDeliveryTime,
      actual_delivery_time: deliveries.actualDeliveryTime,
      created_at: deliveries.createdAt,
    })
    .from(deliveries)
    .where(eq(deliveries.orderId, orderId))
    .limit(1);
  if (!rows[0]) return null;
  const delivery = rows[0];
  return {
    deliveryId: delivery.delivery_id,
    orderId: delivery.order_id,
    driverId: delivery.driver_id,
    driverName: delivery.driver_name,
    driverPhone: delivery.driver_phone,
    vehicle: delivery.vehicle,
    licensePlate: delivery.license_plate,
    deliveryAddress:
      typeof delivery.delivery_address_json === "string"
        ? JSON.parse(delivery.delivery_address_json)
        : delivery.delivery_address_json,
    status: delivery.status,
    assignedAt: delivery.assigned_at,
    estimatedDeliveryTime: delivery.estimated_delivery_time,
    actualDeliveryTime: delivery.actual_delivery_time,
    createdAt: delivery.created_at,
  };
}

export async function getDeliveries(filters = {}) {
  let query = db
    .select({
      delivery_id: deliveries.id,
      order_id: deliveries.orderId,
      driver_id: deliveries.driverId,
      driver_name: deliveries.driverName,
      driver_phone: deliveries.driverPhone,
      vehicle: deliveries.vehicle,
      license_plate: deliveries.licensePlate,
      delivery_address_json: deliveries.deliveryAddress,
      status: deliveries.status,
      assigned_at: deliveries.assignedAt,
      estimated_delivery_time: deliveries.estimatedDeliveryTime,
      actual_delivery_time: deliveries.actualDeliveryTime,
      created_at: deliveries.createdAt,
    })
    .from(deliveries)
    .orderBy(desc(deliveries.createdAt));

  const conditions = [];
  if (filters.status) conditions.push(eq(deliveries.status, filters.status));
  if (filters.driverId)
    conditions.push(eq(deliveries.driverId, filters.driverId));
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  if (filters.limit) {
    query = query.limit(Number(filters.limit));
  }

  const rows = await query;
  return rows.map((delivery) => ({
    deliveryId: delivery.delivery_id,
    orderId: delivery.order_id,
    driverId: delivery.driver_id,
    driverName: delivery.driver_name,
    driverPhone: delivery.driver_phone,
    vehicle: delivery.vehicle,
    licensePlate: delivery.license_plate,
    deliveryAddress:
      typeof delivery.delivery_address_json === "string"
        ? JSON.parse(delivery.delivery_address_json)
        : delivery.delivery_address_json,
    status: delivery.status,
    assignedAt: delivery.assigned_at,
    estimatedDeliveryTime: delivery.estimated_delivery_time,
    actualDeliveryTime: delivery.actual_delivery_time,
    createdAt: delivery.created_at,
  }));
}

export async function getDeliveryStats() {
  // Totals by status
  const [allRows, inProgressRows, completedRows, pendingRows] =
    await Promise.all([
      db.select({ id: deliveries.id }).from(deliveries),
      db
        .select({ id: deliveries.id })
        .from(deliveries)
        .where(eq(deliveries.status, "assigned")),
      db
        .select({ id: deliveries.id })
        .from(deliveries)
        .where(eq(deliveries.status, "completed")),
      db
        .select({ id: deliveries.id })
        .from(deliveries)
        .where(eq(deliveries.status, "pending_assignment")),
    ]);

  // Drivers
  const [allDrivers, availableDriversRows] = await Promise.all([
    db.select({ id: drivers.id }).from(drivers),
    db
      .select({ id: drivers.id })
      .from(drivers)
      .where(eq(drivers.isAvailable, true)),
  ]);

  // Average delivery time (in minutes) for completed deliveries
  const completedWithTimes = await db
    .select({
      assignedAt: deliveries.assignedAt,
      actualDeliveryTime: deliveries.actualDeliveryTime,
    })
    .from(deliveries)
    .where(eq(deliveries.status, "completed"));

  let averageDeliveryTimeMinutes = 0;
  if (completedWithTimes.length > 0) {
    const minutes = completedWithTimes
      .filter((r) => r.assignedAt && r.actualDeliveryTime)
      .map(
        (r) =>
          (new Date(r.actualDeliveryTime).getTime() -
            new Date(r.assignedAt).getTime()) /
          60000
      );
    if (minutes.length > 0) {
      averageDeliveryTimeMinutes =
        minutes.reduce((a, b) => a + b, 0) / minutes.length;
    }
  }

  return {
    totalDeliveries: allRows.length,
    inProgressDeliveries: inProgressRows.length,
    completedDeliveries: completedRows.length,
    pendingDeliveries: pendingRows.length,
    totalDrivers: allDrivers.length,
    availableDrivers: availableDriversRows.length,
    averageDeliveryTimeMinutes: Number(averageDeliveryTimeMinutes.toFixed(2)),
  };
}
