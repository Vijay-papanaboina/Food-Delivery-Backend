import { and, desc, eq, sql, notInArray } from "drizzle-orm";
import { db } from "../config/db.js";
import { deliveries, drivers } from "../db/schema.js";

export async function createDelivery(deliveryData) {
  const [result] = await db
    .insert(deliveries)
    .values({
      deliveryId: deliveryData.orderId, // Use orderId as deliveryId for now
      orderId: deliveryData.orderId,
      driverId: deliveryData.driverId,
      driverName: deliveryData.driverName || null,
      driverPhone: deliveryData.driverPhone || null,
      vehicle: deliveryData.vehicle || null,
      licensePlate: deliveryData.licensePlate || null,
      deliveryAddress: deliveryData.deliveryAddress,
      status: deliveryData.status || "assigned",
      assignedAt: deliveryData.assignedAt
        ? new Date(deliveryData.assignedAt)
        : new Date(),
      estimatedDeliveryTime: deliveryData.estimatedDeliveryTime
        ? new Date(deliveryData.estimatedDeliveryTime)
        : null,
      actualDeliveryTime: deliveryData.actualDeliveryTime
        ? new Date(deliveryData.actualDeliveryTime)
        : null,
      createdAt: new Date(),
    })
    .returning();

  return {
    deliveryId: result.id,
    orderId: result.orderId,
    driverId: result.driverId,
    status: result.status,
    assignedAt: result.assignedAt,
    createdAt: result.createdAt,
  };
}

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
  if (fields.pickedUpAt !== undefined)
    updateSet.pickedUpAt = fields.pickedUpAt
      ? new Date(fields.pickedUpAt)
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
      picked_up_at: deliveries.pickedUpAt,
      estimated_delivery_time: deliveries.estimatedDeliveryTime,
      actual_delivery_time: deliveries.actualDeliveryTime,
      created_at: deliveries.createdAt,
      // Gig-worker fields
      delivery_fee: deliveries.deliveryFee,
      acceptance_status: deliveries.acceptanceStatus,
      declined_by_drivers: deliveries.declinedByDrivers,
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
    pickedUpAt: delivery.picked_up_at,
    estimatedDeliveryTime: delivery.estimated_delivery_time,
    actualDeliveryTime: delivery.actual_delivery_time,
    createdAt: delivery.created_at,
    // Gig-worker fields
    deliveryFee: delivery.delivery_fee
      ? parseFloat(delivery.delivery_fee)
      : 3.5,
    acceptanceStatus: delivery.acceptance_status || "pending",
    declinedByDrivers: delivery.declined_by_drivers || [],
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
      picked_up_at: deliveries.pickedUpAt,
      estimated_delivery_time: deliveries.estimatedDeliveryTime,
      actual_delivery_time: deliveries.actualDeliveryTime,
      created_at: deliveries.createdAt,
      // Gig-worker fields
      delivery_fee: deliveries.deliveryFee,
      acceptance_status: deliveries.acceptanceStatus,
      declined_by_drivers: deliveries.declinedByDrivers,
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
    pickedUpAt: delivery.picked_up_at,
    estimatedDeliveryTime: delivery.estimated_delivery_time,
    actualDeliveryTime: delivery.actual_delivery_time,
    createdAt: delivery.created_at,
    // Gig-worker fields
    deliveryFee: delivery.delivery_fee
      ? parseFloat(delivery.delivery_fee)
      : 3.5,
    acceptanceStatus: delivery.acceptance_status || "pending",
    declinedByDrivers: delivery.declined_by_drivers || [],
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
      picked_up_at: deliveries.pickedUpAt,
      estimated_delivery_time: deliveries.estimatedDeliveryTime,
      actual_delivery_time: deliveries.actualDeliveryTime,
      created_at: deliveries.createdAt,
      // Gig-worker fields
      delivery_fee: deliveries.deliveryFee,
      acceptance_status: deliveries.acceptanceStatus,
      declined_by_drivers: deliveries.declinedByDrivers,
      // Restaurant info
      restaurant_id: deliveries.restaurantId,
      restaurant_name: deliveries.restaurantName,
      restaurant_address: deliveries.restaurantAddress,
      restaurant_phone: deliveries.restaurantPhone,
      // Customer info
      customer_name: deliveries.customerName,
      customer_phone: deliveries.customerPhone,
      // Order info
      order_items: deliveries.orderItems,
      order_total: deliveries.orderTotal,
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
    pickedUpAt: delivery.picked_up_at,
    estimatedDeliveryTime: delivery.estimated_delivery_time,
    actualDeliveryTime: delivery.actual_delivery_time,
    createdAt: delivery.created_at,
    // Gig-worker fields
    deliveryFee: delivery.delivery_fee
      ? parseFloat(delivery.delivery_fee)
      : 3.5,
    acceptanceStatus: delivery.acceptance_status || "pending",
    declinedByDrivers: delivery.declined_by_drivers || [],
    // Restaurant info
    restaurantId: delivery.restaurant_id,
    restaurantName: delivery.restaurant_name,
    restaurantAddress:
      delivery.restaurant_address &&
      typeof delivery.restaurant_address === "object"
        ? delivery.restaurant_address
        : delivery.restaurant_address || null,
    restaurantPhone: delivery.restaurant_phone,
    // Customer info
    customerName: delivery.customer_name,
    customerPhone: delivery.customer_phone,
    // Order info
    orderItems:
      delivery.order_items && typeof delivery.order_items === "object"
        ? delivery.order_items
        : delivery.order_items || [],
    orderTotal: delivery.order_total ? parseFloat(delivery.order_total) : null,
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

export async function getDriverStats(driverId) {
  try {
    // Get total deliveries for this driver
    const totalDeliveries = await db
      .select({ id: deliveries.id })
      .from(deliveries)
      .where(eq(deliveries.driverId, driverId));

    // Get completed deliveries for this driver today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedToday = await db
      .select({ id: deliveries.id })
      .from(deliveries)
      .where(
        and(
          eq(deliveries.driverId, driverId),
          eq(deliveries.status, "completed"),
          sql`${deliveries.actualDeliveryTime} >= ${today}`,
          sql`${deliveries.actualDeliveryTime} < ${tomorrow}`
        )
      );

    // Calculate earnings (assuming $5 per delivery for now)
    const earningsPerDelivery = 5.0;
    const todayEarnings = (completedToday.length * earningsPerDelivery).toFixed(
      2
    );

    return {
      totalDeliveries: totalDeliveries.length,
      completedToday: completedToday.length,
      averageRating: "4.5", // Default rating for now
      earnings: todayEarnings,
    };
  } catch (error) {
    console.error("Error getting driver stats:", error);
    // Return default stats if there's an error
    return {
      totalDeliveries: 0,
      completedToday: 0,
      averageRating: "0.0",
      earnings: "0.00",
    };
  }
}

// Accept delivery - update acceptance status to 'accepted'
export async function acceptDelivery(deliveryId, driverId) {
  const [result] = await db
    .update(deliveries)
    .set({
      acceptanceStatus: "accepted",
    })
    .where(
      and(eq(deliveries.id, deliveryId), eq(deliveries.driverId, driverId))
    )
    .returning();

  return result;
}

// Decline delivery - update status and add to declined list
export async function declineDelivery(deliveryId, driverId) {
  const [result] = await db
    .update(deliveries)
    .set({
      acceptanceStatus: "declined",
      declinedByDrivers: sql`array_append(declined_by_drivers, ${driverId})`,
    })
    .where(
      and(eq(deliveries.id, deliveryId), eq(deliveries.driverId, driverId))
    )
    .returning();

  return result;
}

// Get full delivery details with all information
export async function getDeliveryWithFullDetails(deliveryId) {
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
      picked_up_at: deliveries.pickedUpAt,
      estimated_delivery_time: deliveries.estimatedDeliveryTime,
      actual_delivery_time: deliveries.actualDeliveryTime,
      created_at: deliveries.createdAt,
      // Gig-worker fields
      delivery_fee: deliveries.deliveryFee,
      acceptance_status: deliveries.acceptanceStatus,
      declined_by_drivers: deliveries.declinedByDrivers,
      // Restaurant info
      restaurant_id: deliveries.restaurantId,
      restaurant_name: deliveries.restaurantName,
      restaurant_address: deliveries.restaurantAddress,
      restaurant_phone: deliveries.restaurantPhone,
      // Customer info
      customer_name: deliveries.customerName,
      customer_phone: deliveries.customerPhone,
      // Order info
      order_items: deliveries.orderItems,
      order_total: deliveries.orderTotal,
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
    pickedUpAt: delivery.picked_up_at,
    estimatedDeliveryTime: delivery.estimated_delivery_time,
    actualDeliveryTime: delivery.actual_delivery_time,
    createdAt: delivery.created_at,
    // Gig-worker fields
    deliveryFee: delivery.delivery_fee
      ? parseFloat(delivery.delivery_fee)
      : 3.5,
    acceptanceStatus: delivery.acceptance_status || "pending",
    declinedByDrivers: delivery.declined_by_drivers || [],
    // Restaurant info
    restaurantId: delivery.restaurant_id,
    restaurantName: delivery.restaurant_name,
    restaurantAddress:
      delivery.restaurant_address &&
      typeof delivery.restaurant_address === "object"
        ? delivery.restaurant_address
        : delivery.restaurant_address || null,
    restaurantPhone: delivery.restaurant_phone,
    // Customer info
    customerName: delivery.customer_name,
    customerPhone: delivery.customer_phone,
    // Order info
    orderItems:
      delivery.order_items && typeof delivery.order_items === "object"
        ? delivery.order_items
        : delivery.order_items || [],
    orderTotal: delivery.order_total ? parseFloat(delivery.order_total) : null,
  };
}

// Find available driver for reassignment (excluding declined drivers)
export async function findAvailableDriverForReassignment(
  excludeDriverIds = []
) {
  let query = db
    .select({
      driver_id: drivers.id,
      name: drivers.name,
      phone: drivers.phone,
      vehicle: drivers.vehicle,
      license_plate: drivers.licensePlate,
      is_available: drivers.isAvailable,
    })
    .from(drivers)
    .where(eq(drivers.isAvailable, true));

  // Exclude drivers who have already declined
  if (excludeDriverIds.length > 0) {
    query = query.where(notInArray(drivers.id, excludeDriverIds));
  }

  const rows = await query.limit(1);
  return rows[0] || null;
}

// Update delivery with restaurant/customer/order information
export async function enrichDeliveryWithOrderDetails(deliveryId, orderData) {
  const [result] = await db
    .update(deliveries)
    .set({
      restaurantId: orderData.restaurantId,
      restaurantName: orderData.restaurantName,
      restaurantAddress: orderData.restaurantAddress,
      restaurantPhone: orderData.restaurantPhone,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      orderItems: orderData.orderItems,
      orderTotal: orderData.orderTotal ? String(orderData.orderTotal) : null,
      deliveryFee: orderData.deliveryFee
        ? String(orderData.deliveryFee)
        : "3.50",
    })
    .where(eq(deliveries.id, deliveryId))
    .returning();

  return result;
}
