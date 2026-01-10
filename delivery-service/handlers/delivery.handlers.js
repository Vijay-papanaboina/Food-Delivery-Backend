// Removed uuid import - using database-generated IDs now
import {
  upsertDriver,
  getDriver,
  getDriverByUserId,
  updateDriverAvailability,
} from "../repositories/drivers.repo.js";
import {
  upsertDelivery,
  updateDeliveryFields,
  getDelivery,
  createDelivery,
  declineDelivery,
  findAvailableDriverForReassignment,
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
      licensePlate: driver.licensePlate,
    });

    // Mark driver as unavailable
    await upsertDriver({
      driverId: driver.id, // driver.id now equals user.id
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle,
      licensePlate: driver.licensePlate,
      isAvailable: false,
      currentLocation: driver.currentLocation,
      rating: driver.rating,
      totalDeliveries: driver.totalDeliveries,
      updatedAt: assignedAt,
    });

    // Publish delivery assigned event AFTER database insert
    await publishMessage(
      producer,
      TOPICS.DELIVERY_ASSIGNED,
      {
        deliveryId: createdDelivery.deliveryId,
        orderId,
        driverId,
        assignedAt,
        estimatedDeliveryTime,
      },
      orderId
    );

    console.log(
      `✅ [${serviceName}] Delivery ${createdDelivery.deliveryId} assigned to driver ${driverId} for order ${orderId}`
    );

    return createdDelivery.deliveryId; // Return the deliveryId for use in pickup
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

    const incrementedTotal = (existingDriver?.totalDeliveries || 0) + 1;
    await upsertDriver({
      driverId: existingDriver.id, // driver.id now equals user.id
      name: existingDriver?.name,
      phone: existingDriver?.phone,
      vehicle: existingDriver?.vehicle,
      licensePlate: existingDriver?.licensePlate,
      isAvailable: true,
      currentLocation: existingDriver?.currentLocation, // Preserve existing location
      rating: existingDriver?.rating || 0.0,
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
    // Mongoose repo returns camelCase
    const availableDrivers = await import("../repositories/drivers.repo.js").then(m => m.getDrivers({ isAvailable: true }));

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
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
      rating: selectedDriver.rating,
      totalDeliveries: selectedDriver.totalDeliveries,
    });

    // Generate random ETA between 15-30 minutes
    const minMinutes = 15;
    const maxMinutes = 30;
    const randomMinutes =
      Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
    const estimatedDeliveryTime = new Date(
      Date.now() + randomMinutes * 60 * 1000
    ).toISOString();

    // Create delivery record
    const delivery = await createDelivery({
      orderId,
      driverId: selectedDriver.id,
      restaurantId,
      userId: orderData.userId,
      deliveryAddress,
      status: "assigned",
      assignedAt: new Date().toISOString(),
      estimatedDeliveryTime: estimatedDeliveryTime,
      driverName: selectedDriver.name,
      driverPhone: selectedDriver.phone,
      vehicle: selectedDriver.vehicle,
      licensePlate: selectedDriver.licensePlate,
    });

    // Update driver availability to false
    await updateDriverAvailability(selectedDriver.id, false);

    // Increment driver's delivery count
    await incrementDriverDeliveries(selectedDriver.id);

    // Publish delivery assigned event
    await publishMessage(
      producer,
      TOPICS.DELIVERY_ASSIGNED,
      {
        deliveryId: delivery.id,
        orderId,
        driverId: selectedDriver.id,
        assignedAt: delivery.assignedAt,
        estimatedDeliveryTime: estimatedDeliveryTime,
      },
      orderId
    );

    console.log(`✅ [${serviceName}] Driver auto-assigned successfully`, {
      orderId,
      deliveryId: delivery.id,
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
    });

    return {
      deliveryId: delivery.id,
      driverId: selectedDriver.id,
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

// updateDriverAvailability is now imported from repositories/drivers.repo.js

/**
 * Increments driver's total deliveries count
 * @param {string} driverId - Driver ID
 */
async function incrementDriverDeliveries(driverId) {
  try {
    const driver = await getDriver(driverId);
    if (driver) {
      await upsertDriver({
        driverId: driver.id,
        name: driver.name,
        phone: driver.phone,
        vehicle: driver.vehicle,
        licensePlate: driver.licensePlate,
        isAvailable: driver.isAvailable,
        currentLocation: driver.currentLocation,
        rating: driver.rating,
        totalDeliveries: (driver.totalDeliveries || 0) + 1,
        updatedAt: new Date(),
      });
    }

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

    const {
      orderId,
      restaurantId,
      userId,
      items,
      total,
      deliveryAddress,
      restaurant, // Destructure restaurant from orderData
      customer,
    } = orderData;

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

    // Enrich delivery with order details
    const { enrichDeliveryWithOrderDetails } = await import(
      "../repositories/deliveries.repo.js"
    );
    await enrichDeliveryWithOrderDetails(assignedDriver.deliveryId, {
      restaurantId,
      restaurantName: restaurant?.name || null,
      restaurantAddress: restaurant?.address || null, // Pass restaurant.address
      restaurantPhone: restaurant?.phone || null,
      customerName: customer?.name || null,
      customerPhone: customer?.phone || null,
      orderItems: items || [],
      orderTotal: total || null,
    });

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
 * Reassign delivery when declined by driver
 * @param {string} orderId - Order ID
 * @param {string} deliveryId - Delivery ID
 * @param {Array} excludeDriverIds - Driver IDs who have declined
 * @param {Object} producer - Kafka producer
 * @param {string} serviceName - Service name
 */
export async function reassignDelivery(
  orderId,
  deliveryId,
  excludeDriverIds,
  producer,
  serviceName
) {
  try {
    console.log(
      `🔄 [${serviceName}] Reassigning delivery ${deliveryId} for order ${orderId}`
    );
    console.log(`   Excluding drivers: ${excludeDriverIds.join(", ")}`);

    // Find an available driver (excluding those who declined)
    const availableDriver = await findAvailableDriverForReassignment(
      excludeDriverIds
    );

    if (!availableDriver) {
      console.warn(
        `⚠️ [${serviceName}] No available drivers found for reassignment of delivery ${deliveryId}`
      );

      // Mark delivery as unassigned
      await updateDeliveryFields(deliveryId, {
        status: "unassigned",
      });

      // Publish event for admin notification
      await publishMessage(
        producer,
        TOPICS.DELIVERY_UNASSIGNED,
        {
          deliveryId,
          orderId,
          reason: "No available drivers",
          declinedByDrivers: excludeDriverIds,
          timestamp: new Date().toISOString(),
        },
        orderId
      );

      return null;
    }

    // Assign to the new driver
    await updateDeliveryFields(deliveryId, {
      driverId: availableDriver.id,
      status: "assigned",
      assignedAt: new Date().toISOString(),
    });

    // Set new driver as unavailable
    await updateDriverAvailability(availableDriver.id, false);

    console.log(
      `✅ [${serviceName}] Delivery ${deliveryId} reassigned to driver ${availableDriver.name}`
    );

    // Publish reassignment event
    await publishMessage(
      producer,
      TOPICS.DELIVERY_REASSIGNED,
      {
        deliveryId,
        orderId,
        newDriverId: availableDriver.id,
        newDriverName: availableDriver.name,
        previousDeclines: excludeDriverIds.length,
        timestamp: new Date().toISOString(),
      },
      orderId
    );

    return availableDriver;
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Error reassigning delivery ${deliveryId}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Initialize sample driver data if needed
 */
