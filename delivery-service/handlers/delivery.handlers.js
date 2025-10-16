import { v4 as uuidv4 } from "uuid";
import { upsertDriver, getDrivers, getDriver } from "../repositories/drivers.repo.js";
import { upsertDelivery } from "../repositories/deliveries.repo.js";
import { db } from "../config/db.js";
import { sql } from "drizzle-orm";
import { publishMessage, TOPICS } from "../config/kafka.js";

/**
 * Handle food ready event
 * Automatically assigns delivery driver and creates delivery record
 */
export async function handleFoodReady(foodData, producer, serviceName) {
  const { orderId, restaurantId, userId, total, deliveryAddress } = foodData;
  const client = await db.session();

  try {
    await client.query('BEGIN');
    
    console.log(`🚗 [${serviceName}] Auto-assigning delivery for order ${orderId}`);

    // Find available driver using database query with FOR UPDATE to lock rows
    const availableResult = await db.execute(sql`
      SELECT * FROM delivery_svc.drivers 
      WHERE is_available = true 
      ORDER BY rating DESC 
      LIMIT 5`);
    const availableDrivers = availableResult.rows || availableResult;

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
      await db.execute(sql`
        INSERT INTO delivery_svc.deliveries (
          delivery_id, order_id, status, assigned_at, 
          estimated_delivery_time, actual_delivery_time, created_at
        ) VALUES (${delivery.deliveryId}, ${delivery.orderId}, ${delivery.status}, ${delivery.assignedAt}, ${delivery.estimatedDeliveryTime}, ${delivery.actualDeliveryTime}, ${delivery.createdAt})`);

      await client.query('COMMIT');
      return;
    }

    // Assign to the best available driver (highest rating)
    const driver = availableDrivers[0];
    await assignDelivery(orderId, driver.driver_id, deliveryAddress, producer, serviceName);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
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
    const driverRowsResult = await db.execute(sql`SELECT * FROM delivery_svc.drivers WHERE driver_id = ${driverId}`);
    const driverRows = driverRowsResult.rows || driverRowsResult;
    
    if (driverRows.length === 0) {
      throw new Error(`Driver ${driverId} not found`);
    }
    
    const driver = driverRows[0];
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
    await db.execute(sql`
      INSERT INTO delivery_svc.deliveries (
        delivery_id, order_id, driver_id, driver_name, driver_phone, vehicle, license_plate,
        delivery_address_json, status, assigned_at, estimated_delivery_time, actual_delivery_time, created_at
      ) VALUES (${delivery.deliveryId}, ${delivery.orderId}, ${delivery.driverId}, ${driver.name}, ${driver.phone}, ${driver.vehicle}, ${driver.license_plate}, ${JSON.stringify(delivery.deliveryAddress)}, ${delivery.status}, ${delivery.assignedAt}, ${delivery.estimatedDeliveryTime}, ${delivery.actualDeliveryTime}, ${delivery.createdAt})`);
    
    // Mark driver as unavailable
    await db.execute(sql`UPDATE delivery_svc.drivers SET is_available = false, updated_at = ${assignedAt} WHERE driver_id = ${driverId}`);
    
    await client.query('COMMIT');
    
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
    await db.execute(sql`UPDATE delivery_svc.deliveries SET status = 'completed', actual_delivery_time = ${completedAt} WHERE delivery_id = ${deliveryId}`);
    
    // Mark driver as available and increment delivery count
    await db.execute(sql`UPDATE delivery_svc.drivers SET is_available = true, total_deliveries = total_deliveries + 1, updated_at = ${new Date().toISOString()} WHERE driver_id = ${driverId}`);
    
    // Get delivery details for event
    const deliveryResult = await db.execute(sql`SELECT * FROM delivery_svc.deliveries WHERE delivery_id = ${deliveryId}`);
    const delivery = (deliveryResult.rows || deliveryResult)[0];
    
    await client.query('COMMIT');
    
    // Publish delivery completed event
    await publishMessage(
      producer,
      TOPICS.DELIVERY_COMPLETED,
      {
        deliveryId,
        orderId: delivery.order_id,
        driverId: delivery.driver_id,
        completedAt: delivery.actual_delivery_time,
        estimatedTime: delivery.estimated_delivery_time,
        actualTime: delivery.actual_delivery_time,
      },
      delivery.order_id
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
    const { rows: existingDrivers } = await pool.query(
      'SELECT COUNT(*) as count FROM delivery_svc.drivers'
    );
    
    if (parseInt(existingDrivers[0].count) > 0) {
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
