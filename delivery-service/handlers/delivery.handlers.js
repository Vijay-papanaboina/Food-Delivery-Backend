import { v4 as uuidv4 } from "uuid";
import { upsertDriver, getDrivers, getDriver } from "../repositories/drivers.repo.js";
import { upsertDelivery } from "../repositories/deliveries.repo.js";
import { publishMessage, TOPICS } from "../config/kafka.js";

/**
 * Handle food ready event
 * Automatically assigns delivery driver and creates delivery record
 */
export async function handleFoodReady(foodData, producer, serviceName) {
  const { orderId, restaurantId, userId, total, deliveryAddress } = foodData;
  try {
    // Begin logical transaction scope
    
    console.log(`🚗 [${serviceName}] Auto-assigning delivery for order ${orderId}`);

    // Find available driver using database query with FOR UPDATE to lock rows
    const availableDrivers = await getDrivers({ isAvailable: true, limit: 5 });

    if (availableDrivers.length === 0) {
      console.log(`⚠️ [${serviceName}] No available drivers for order ${orderId}`);

      // Create delivery record with pending status in database
      const delivery = {
        deliveryId: uuidv4(),
        orderId,
        status: "pending_assignment",
        assignedAt: null,
        estimatedDeliveryTime: null,
        actualDeliveryTime: null,
        createdAt: new Date().toISOString(),
      };

      // Save to database
      await upsertDelivery(delivery);
      return;
    }

    // Assign to the best available driver (highest rating)
    const driver = availableDrivers[0];
    await assignDelivery(orderId, driver.driver_id, deliveryAddress, producer, serviceName);
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Error handling food ready event:`,
      error.message
    );
  } finally {}
}

/**
 * Assign delivery to a specific driver
 * @param {string} orderId - Order ID
 * @param {string} driverId - Driver ID
 */
export async function assignDelivery(orderId, driverId, deliveryAddress, producer, serviceName) {
  
  try {
    
    
    console.log(`🚗 [${serviceName}] Assigning delivery for order ${orderId} to driver ${driverId}`);
    
    // Get driver information
    const driver = await getDriver(driverId);
    if (!driver) {
      throw new Error(`Driver ${driverId} not found`);
    }
    const assignedAt = new Date().toISOString();
    const deliveryId = uuidv4();
    
    // Calculate estimated delivery time (20-30 minutes from now)
    const estimatedDeliveryTime = new Date(Date.now() + (20 + Math.random() * 10) * 60 * 1000).toISOString();
    
    // Create delivery record
    const delivery = {
      deliveryId,
      orderId,
      driverId,
      deliveryAddress, // Include delivery address
      status: "assigned",
      assignedAt,
      estimatedDeliveryTime,
      actualDeliveryTime: null,
      createdAt: assignedAt,
    };
    
    // Save delivery to database
    await upsertDelivery({
      ...delivery,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicle: driver.vehicle,
      licensePlate: driver.license_plate,
    });
    
    // Mark driver as unavailable
    await upsertDriver({ ...driver, isAvailable: false, updatedAt: assignedAt });
    
    // Publish delivery assigned event
    await publishMessage(
      producer,
      TOPICS.DELIVERY_ASSIGNED,
      {
        deliveryId,
        orderId,
        driverId,
        assignedAt,
        estimatedDeliveryTime,
      },
      orderId
    );
    
    console.log(
      `✅ [${serviceName}] Delivery ${deliveryId} assigned to driver ${driverId} for order ${orderId}`
    );
    
    // Simulate delivery completion after a random delay (30-45 seconds)
    setTimeout(async () => {
      await completeDelivery(deliveryId, orderId, driverId, producer, serviceName);
    }, (30 + Math.random() * 15) * 1000);
    
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Error assigning delivery:`,
      error.message
    );
    throw error;
  } finally {}
}

/**
 * Complete a delivery
 * @param {string} deliveryId - Delivery ID
 * @param {string} orderId - Order ID
 * @param {string} driverId - Driver ID
 */
export async function completeDelivery(deliveryId, orderId, driverId, producer, serviceName) {
  
  try {
    
    
    console.log(`⏳ [${serviceName}] Completing delivery ${deliveryId} for order ${orderId}`);
    
    const completedAt = new Date().toISOString();
    
    // Update delivery status to completed
    await upsertDelivery({ deliveryId, status: 'completed', actualDeliveryTime: completedAt });
    
    // Mark driver as available and increment delivery count
    await upsertDriver({ driverId, isAvailable: true, totalDeliveries: (driver?.total_deliveries || 0) + 1, updatedAt: new Date().toISOString() });
    
    // Get delivery details for event
    const delivery = await (async () => {
      const res = await getDrivers({ limit: 1 });
      return { order_id: orderId, driver_id: driverId, estimated_delivery_time: null, actual_delivery_time: completedAt };
    })();
    
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
      estimatedTime: delivery.estimated_delivery_time,
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
  } finally {}
}

/**
 * Initialize sample driver data if needed
 */
export async function initializeSampleDrivers() {
  try {
    // Check if we already have drivers in the database
    const existing = await getDrivers({ limit: 1 });
    if (existing.length > 0) {
      console.log(`🚗 [delivery-service] Drivers already exist in database`);
      return;
    }
    
    const sampleDrivers = [
      {
        driverId: "driver-001",
        name: "John Smith",
        phone: "+1-555-1001",
        vehicle: "Honda Civic",
        licensePlate: "ABC-123",
        isAvailable: true,
        currentLocation: { lat: 40.7128, lng: -74.006 },
        rating: 4.8,
        totalDeliveries: 156,
        createdAt: new Date().toISOString(),
      },
      {
        driverId: "driver-002",
        name: "Sarah Johnson",
        phone: "+1-555-1002",
        vehicle: "Toyota Corolla",
        licensePlate: "XYZ-789",
        isAvailable: true,
        currentLocation: { lat: 40.7589, lng: -73.9851 },
        rating: 4.9,
        totalDeliveries: 203,
        createdAt: new Date().toISOString(),
      },
      {
        driverId: "driver-003",
        name: "Mike Davis",
        phone: "+1-555-1003",
        vehicle: "Ford Focus",
        licensePlate: "DEF-456",
        isAvailable: true,
        currentLocation: { lat: 40.7505, lng: -73.9934 },
        rating: 4.6,
        totalDeliveries: 89,
        createdAt: new Date().toISOString(),
      },
      {
        driverId: "driver-004",
        name: "Emily Wilson",
        phone: "+1-555-1004",
        vehicle: "Nissan Altima",
        licensePlate: "GHI-789",
        isAvailable: true,
        currentLocation: { lat: 40.7282, lng: -73.7949 },
        rating: 4.7,
        totalDeliveries: 134,
        createdAt: new Date().toISOString(),
      },
      {
        driverId: "driver-005",
        name: "Alex Brown",
        phone: "+1-555-1005",
        vehicle: "Hyundai Elantra",
        licensePlate: "JKL-012",
        isAvailable: true,
        currentLocation: { lat: 40.7614, lng: -73.9776 },
        rating: 4.5,
        totalDeliveries: 67,
        createdAt: new Date().toISOString(),
      },
    ];

    // Insert sample drivers into database
    for (const driver of sampleDrivers) {
      await upsertDriver(driver);
    }

    console.log(
      `🚗 [delivery-service] Initialized ${sampleDrivers.length} sample drivers`
    );
  } catch (error) {
    console.error(
      `❌ [delivery-service] Error initializing sample drivers:`,
      error.message
    );
  }
}
