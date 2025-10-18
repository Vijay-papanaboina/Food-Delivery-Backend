// Removed uuid import - using database-generated IDs now
import {
  upsertDriver,
  getDrivers,
  getDriver,
} from "../repositories/drivers.repo.js";
import {
  upsertDelivery,
  updateDeliveryFields,
  getDelivery,
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

    // No automatic completion - must be called manually
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
    const existingDriver = await getDriver(driverId);
    const incrementedTotal = (existingDriver?.total_deliveries || 0) + 1;
    await upsertDriver({
      driverId,
      name: existingDriver?.name,
      phone: existingDriver?.phone,
      vehicle: existingDriver?.vehicle,
      licensePlate: existingDriver?.license_plate,
      isAvailable: true,
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
 * Initialize sample driver data if needed
 */
