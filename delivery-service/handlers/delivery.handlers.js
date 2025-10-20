// Removed uuid import - using database-generated IDs now
import { eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { drivers } from "../db/schema.js";
import {
  upsertDriver,
  getDriver,
  getDriverByUserId,
} from "../repositories/drivers.repo.js";
import {
  upsertDelivery,
  updateDeliveryFields,
  getDelivery,
  createDelivery,
} from "../repositories/deliveries.repo.js";
import { publishMessage, TOPICS } from "../config/kafka.js";

/**
 * Assign delivery to a specific driver
 * @param {string} orderId - Order ID
 * @param {string} driverId - Driver ID
 */
export async function assignDelivery(
  orderId,
  driverId,
  deliveryAddress,
  producer,
  serviceName
) {
  try {
    console.log(
      `🚗 [${serviceName}] Assigning delivery for order ${orderId} to driver ${driverId}`
    );

    // Get driver information
    const driver = await getDriver(driverId);
    if (!driver) {
      throw new Error(`Driver ${driverId} not found`);
    }
    const assignedAt = new Date().toISOString();

    // Fixed estimated delivery time (10 seconds from now for simulation)
    const estimatedDeliveryTime = new Date(
      Date.now() + 10 * 1000
    ).toISOString();

    // Create delivery record (let database generate deliveryId)
    const delivery = {
      // Don't provide deliveryId - let database generate it
      orderId,
      driverId,
      deliveryAddress, // Include delivery address
      status: "assigned",
      assignedAt,
      estimatedDeliveryTime,
      actualDeliveryTime: null,
      createdAt: assignedAt,
    };

    // Save delivery to database and get the created delivery with generated ID
    const createdDelivery = await upsertDelivery({
      ...delivery,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicle: driver.vehicle,
      licensePlate: driver.license_plate,
    });

    // Mark driver as unavailable
    await upsertDriver({
      driverId: driver.driver_id,
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle,
      licensePlate: driver.license_plate,
      isAvailable: false,
      currentLocation: driver.current_location,
      rating: driver.rating,
      totalDeliveries: driver.total_deliveries,
      updatedAt: assignedAt,
    });

    // Publish delivery assigned event AFTER database insert
    await publishMessage(
      producer,
      TOPICS.DELIVERY_ASSIGNED,
      {
        deliveryId: createdDelivery.id,
        orderId,
        driverId,
        assignedAt,
        estimatedDeliveryTime,
      },
      orderId
    );

    console.log(
      `✅ [${serviceName}] Delivery ${createdDelivery.id} assigned to driver ${driverId} for order ${orderId}`
    );

    return createdDelivery.id; // Return the deliveryId for use in pickup
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Error assigning delivery:`,
      error.message
    );
    throw error;
  } finally {
  }
}

/**
 * Pick up delivery (driver picks up food from restaurant)
 * @param {string} deliveryId - Delivery ID
 * @param {string} orderId - Order ID
 * @param {string} driverId - Driver ID
 */
export async function pickupDelivery(
  deliveryId,
  orderId,
  driverId,
  producer,
  serviceName
) {
  try {
    console.log(
      `📦 [${serviceName}] Driver ${driverId} picking up order ${orderId}`
    );

    const pickedUpAt = new Date().toISOString();

    // Update delivery status to picked_up
    await updateDeliveryFields(deliveryId, {
      status: "picked_up",
      pickedUpAt: pickedUpAt,
    });

    // Publish delivery picked up event
    await publishMessage(
      producer,
      TOPICS.DELIVERY_PICKED_UP,
      {
        deliveryId,
        orderId,
        driverId,
        pickedUpAt,
      },
      orderId
    );

    console.log(
      `✅ [${serviceName}] Delivery ${deliveryId} picked up by driver ${driverId} for order ${orderId}`
    );
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Error picking up delivery ${deliveryId}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Complete a delivery
 * @param {string} deliveryId - Delivery ID
 * @param {string} orderId - Order ID
 * @param {string} driverId - Driver ID
 */
export async function completeDelivery(
  deliveryId,
  orderId,
  driverId,
  producer,
  serviceName
) {
  try {
    console.log(
      `⏳ [${serviceName}] Completing delivery ${deliveryId} for order ${orderId}`
    );

    const completedAt = new Date().toISOString();

    // Update delivery status to completed (avoid insert with null NOT NULL columns)
    await updateDeliveryFields(deliveryId, {
      status: "completed",
      actualDeliveryTime: completedAt,
    });

    // Mark driver as available and increment delivery count
    // driverId here is the user ID from JWT token
    const existingDriver = await getDriverByUserId(driverId);
    if (!existingDriver) {
      console.log(
        `⚠️ [${serviceName}] Driver with user ID ${driverId} not found for completion update`
      );
      return;
    }

    const incrementedTotal = (existingDriver?.total_deliveries || 0) + 1;
    await upsertDriver({
      driverId: existingDriver.driver_id, // Use the database driver ID
      userId: existingDriver.user_id, // Use the user ID
      name: existingDriver?.name,
      phone: existingDriver?.phone,
      vehicle: existingDriver?.vehicle,
      licensePlate: existingDriver?.license_plate,
      isAvailable: true,
      currentLocation: existingDriver?.current_location, // Preserve existing location
      rating: existingDriver?.rating || "0.0",
      totalDeliveries: incrementedTotal,
      updatedAt: new Date().toISOString(),
    });

    // Get delivery details for event
    const delivery = await getDelivery(deliveryId);

    // logical transaction ended

    // Publish delivery completed event
    await publishMessage(
      producer,
      TOPICS.DELIVERY_COMPLETED,
      {
        deliveryId,
        orderId,
        driverId,
        completedAt,
        estimatedTime: delivery?.estimatedDeliveryTime ?? null,
        actualTime: completedAt,
      },
      orderId
    );

    console.log(
      `✅ [${serviceName}] Delivery ${deliveryId} for order ${orderId} completed`
    );
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Error completing delivery ${deliveryId}:`,
      error.message
    );
    throw error;
  } finally {
  }
}

/**
 * Auto-assigns a driver to an order based on availability and proximity
 * @param {Object} orderData - Order information from Kafka
 * @param {Object} producer - Kafka producer
 * @param {string} serviceName - Service name for logging
 * @returns {Object|null} - Assigned driver info or null if no driver available
 */
export async function autoAssignDriver(orderData, producer, serviceName) {
  const { orderId, restaurantId, deliveryAddress } = orderData;

  console.log(
    `🚗 [${serviceName}] Starting auto-assignment for order ${orderId}`
  );

  try {
    // Validate input data
    if (!orderData || !orderId || !restaurantId || !deliveryAddress) {
      console.error(
        `❌ [${serviceName}] Invalid order data for auto-assignment:`,
        orderData
      );
      return null;
    }

    // Get all available drivers (not currently on delivery)
    const availableDrivers = await db
      .select({
        driverId: drivers.userId, // Use userId instead of id to match JWT tokens
        driverTableId: drivers.id, // Keep the table ID for updates
        name: drivers.name,
        phone: drivers.phone,
        vehicle: drivers.vehicle,
        licensePlate: drivers.licensePlate,
        isAvailable: drivers.isAvailable,
        currentLocationLat: drivers.currentLocationLat,
        currentLocationLng: drivers.currentLocationLng,
        rating: drivers.rating,
        totalDeliveries: drivers.totalDeliveries,
      })
      .from(drivers)
      .where(eq(drivers.isAvailable, true));

    console.log(
      `📊 [${serviceName}] Found ${availableDrivers.length} available drivers`
    );

    if (availableDrivers.length === 0) {
      console.log(
        `⚠️ [${serviceName}] No available drivers found for order ${orderId}`
      );
      return null;
    }

    console.log(
      `🚗 [${serviceName}] Found ${availableDrivers.length} available drivers for order ${orderId}`
    );

    // Simple assignment algorithm:
    // 1. Prioritize drivers with higher ratings
    // 2. Among same ratings, prioritize drivers with fewer total deliveries (load balancing)
    const selectedDriver = selectBestDriver(availableDrivers);

    if (!selectedDriver) {
      console.log(
        `⚠️ [${serviceName}] No suitable driver found after selection for order ${orderId}`
      );
      return null;
    }

    console.log(`🚗 [${serviceName}] Driver selected for auto-assignment`, {
      orderId,
      driverId: selectedDriver.driverId,
      driverName: selectedDriver.name,
      rating: selectedDriver.rating,
      totalDeliveries: selectedDriver.totalDeliveries,
    });

    // Create delivery record
    const delivery = await createDelivery({
      orderId,
      driverId: selectedDriver.driverId,
      restaurantId,
      userId: orderData.userId,
      deliveryAddress,
      status: "assigned",
      assignedAt: new Date().toISOString(),
      driverName: selectedDriver.name,
      driverPhone: selectedDriver.phone,
      vehicle: selectedDriver.vehicle,
      licensePlate: selectedDriver.licensePlate,
    });

    // Update driver availability to false (use driverTableId for database operations)
    await updateDriverAvailability(selectedDriver.driverTableId, false);

    // Increment driver's delivery count (use driverTableId for database operations)
    await incrementDriverDeliveries(selectedDriver.driverTableId);

    // Publish delivery assigned event
    await publishMessage(
      producer,
      TOPICS.DELIVERY_ASSIGNED,
      {
        deliveryId: delivery.deliveryId,
        orderId,
        driverId: selectedDriver.driverId,
        assignedAt: delivery.assignedAt,
        estimatedDeliveryTime: new Date(Date.now() + 10 * 1000).toISOString(),
      },
      orderId
    );

    console.log(`✅ [${serviceName}] Driver auto-assigned successfully`, {
      orderId,
      deliveryId: delivery.deliveryId,
      driverId: selectedDriver.driverId,
      driverName: selectedDriver.name,
    });

    return {
      deliveryId: delivery.deliveryId,
      driverId: selectedDriver.driverId,
      driverName: selectedDriver.name,
      driverPhone: selectedDriver.phone,
      vehicle: selectedDriver.vehicle,
      licensePlate: selectedDriver.licensePlate,
      rating: selectedDriver.rating,
      totalDeliveries: selectedDriver.totalDeliveries,
    };
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Error in auto-assignment:`,
      error.message
    );
    throw error;
  }
}

/**
 * Selects the best driver from available drivers
 * @param {Array} availableDrivers - Array of available drivers
 * @returns {Object|null} - Selected driver or null
 */
function selectBestDriver(availableDrivers) {
  if (availableDrivers.length === 0) return null;

  // Sort drivers by rating (descending) and then by total deliveries (ascending)
  const sortedDrivers = availableDrivers.sort((a, b) => {
    // First, sort by rating (higher is better)
    const ratingDiff = parseFloat(b.rating) - parseFloat(a.rating);
    if (ratingDiff !== 0) return ratingDiff;

    // If ratings are equal, sort by total deliveries (lower is better for load balancing)
    return a.totalDeliveries - b.totalDeliveries;
  });

  // Return the best driver
  return sortedDrivers[0];
}

/**
 * Updates driver availability after assignment
 * @param {string} driverId - Driver ID
 * @param {boolean} isAvailable - New availability status
 */
async function updateDriverAvailability(driverId, isAvailable) {
  try {
    await db
      .update(drivers)
      .set({
        isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId));

    console.log(`🚗 [delivery-service] Driver availability updated`, {
      driverId,
      isAvailable,
    });
  } catch (error) {
    console.error(
      `❌ [delivery-service] Error updating driver availability:`,
      error.message
    );
    throw error;
  }
}

/**
 * Increments driver's total deliveries count
 * @param {string} driverId - Driver ID
 */
async function incrementDriverDeliveries(driverId) {
  try {
    await db
      .update(drivers)
      .set({
        totalDeliveries: sql`${drivers.totalDeliveries} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId));

    console.log(`🚗 [delivery-service] Driver deliveries count incremented`, {
      driverId,
    });
  } catch (error) {
    console.error(
      `❌ [delivery-service] Error incrementing driver deliveries:`,
      error.message
    );
    throw error;
  }
}

/**
 * Handle food-ready events by auto-assigning a driver
 * @param {Object} orderData - Order data from Kafka
 * @param {Object} producer - Kafka producer
 * @param {string} serviceName - Service name for logging
 */
export async function handleFoodReady(orderData, producer, serviceName) {
  console.log(
    `📥 [${serviceName}] Processing food-ready event:`,
    orderData ? `order ${orderData.orderId}` : "no order data"
  );

  try {
    // Validate input data
    if (!orderData || typeof orderData !== "object") {
      console.error(
        `❌ [${serviceName}] Invalid order data received:`,
        orderData
      );
      return;
    }

    const { orderId, restaurantId, userId, items, total, deliveryAddress } =
      orderData;

    if (!orderId || !restaurantId || !deliveryAddress) {
      console.error(
        `❌ [${serviceName}] Missing required fields in order data:`,
        {
          orderId: !!orderId,
          restaurantId: !!restaurantId,
          deliveryAddress: !!deliveryAddress,
        }
      );
      return;
    }

    // Auto-assign a driver
    const assignedDriver = await autoAssignDriver(
      {
        orderId,
        restaurantId,
        userId,
        deliveryAddress,
      },
      producer,
      serviceName
    );

    if (!assignedDriver) {
      console.log(
        `⚠️ [${serviceName}] No driver available for auto-assignment for order ${orderId}`
      );
      // TODO: Implement fallback mechanism (notify restaurant, queue for later, etc.)
      return;
    }

    console.log(`✅ [${serviceName}] Food-ready event processed successfully`, {
      orderId,
      deliveryId: assignedDriver.deliveryId,
      driverId: assignedDriver.driverId,
      driverName: assignedDriver.driverName,
    });
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Error handling food-ready event:`,
      error.message
    );
  }
}

/**
 * Initialize sample driver data if needed
 */
