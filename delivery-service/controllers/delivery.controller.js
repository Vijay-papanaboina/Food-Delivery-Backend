import {
  getDeliveryByOrderId,
  getDeliveries,
  getDeliveryStats,
  getDriverStats,
  acceptDelivery as acceptDeliveryRepo,
  declineDelivery as declineDeliveryRepo,
  getDeliveryWithFullDetails,
  getDelivery,
} from "../repositories/deliveries.repo.js";
import {
  getDrivers,
  updateDriverAvailability,
  getDriverByUserId,
} from "../repositories/drivers.repo.js";
import {
  pickupDelivery,
  completeDelivery,
  reassignDelivery,
} from "../handlers/delivery.handlers.js";
import { logger } from "../utils/logger.js";
import { publishMessage, TOPICS } from "../config/kafka.js";

export const getDeliveryByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    logger.info("Getting delivery by order ID", { orderId });

    // Validate orderId
    if (!orderId || typeof orderId !== "string") {
      return res
        .status(400)
        .json({ error: "Invalid orderId: must be a non-empty string" });
    }

    const delivery = await getDeliveryByOrderId(orderId);
    if (!delivery)
      return res
        .status(404)
        .json({ error: "Delivery not found for this order" });

    // Transform database fields to camelCase for API response
    const transformedDelivery = {
      deliveryId: delivery.delivery_id,
      orderId: delivery.order_id,
      driverId: delivery.driver_id,
      driverName: delivery.driver_name,
      driverPhone: delivery.driver_phone,
      vehicle: delivery.vehicle,
      licensePlate: delivery.license_plate,
      status: delivery.status,
      assignedAt: delivery.assigned_at,
      estimatedDeliveryTime: delivery.estimated_delivery_time,
      actualDeliveryTime: delivery.actual_delivery_time,
      createdAt: delivery.created_at,
    };

    res.json({
      message: "Delivery retrieved successfully",
      delivery: transformedDelivery,
    });
  } catch (error) {
    console.error(
      `❌ [delivery-service] Error retrieving delivery:`,
      error.message
    );
    res
      .status(500)
      .json({ error: "Failed to retrieve delivery", details: error.message });
  }
};

export const listDeliveries = async (req, res) => {
  try {
    const { status, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);

    // If user is authenticated, get their driver record and filter by user ID
    if (req.user && req.user.userId) {
      const driver = await getDriverByUserId(req.user.userId);
      if (!driver) {
        return res.status(404).json({
          error: "Driver profile not found for this user",
          message: "Please contact support to set up your driver account",
        });
      }
      // driver.id equals user.id (shared primary key)
      filters.driverId = driver.id;
    }

    const deliveries = await getDeliveries(filters);
    res.json({
      message: "Deliveries retrieved successfully",
      deliveries,
      total: deliveries.length,
    });
  } catch (error) {
    console.error("Error in listDeliveries:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve deliveries", details: error.message });
  }
};

export const listDrivers = async (req, res) => {
  try {
    const { isAvailable, limit } = req.query;
    const filters = {};
    if (isAvailable !== undefined) filters.isAvailable = isAvailable === "true";
    if (limit) filters.limit = parseInt(limit);
    const drivers = await getDrivers(filters);
    res.json({
      message: "Drivers retrieved successfully",
      drivers,
      total: drivers.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve drivers", details: error.message });
  }
};

export const deliveryStats = async (req, res) => {
  try {
    // If user is authenticated, return driver-specific stats
    if (req.user && req.user.userId) {
      const driverStats = await getDriverStats(req.user.userId);
      res.json({
        message: "Driver statistics retrieved successfully",
        stats: driverStats,
      });
    } else {
      // Return general delivery stats for unauthenticated requests
      const stats = await getDeliveryStats();
      res.json({
        message: "Delivery statistics retrieved successfully",
        stats,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve delivery statistics",
      details: error.message,
    });
  }
};

// Manual assignment removed - now using auto-assignment via Kafka

export const pickupDeliveryByDriver = async (req, res) => {
  try {
    const { deliveryId, orderId, driverId } = req.body;

    // Validate required fields
    if (!deliveryId || !orderId || !driverId) {
      return res.status(400).json({
        error: "Missing required fields: deliveryId, orderId, driverId",
      });
    }

    // Validate data types
    if (
      typeof deliveryId !== "string" ||
      typeof orderId !== "string" ||
      typeof driverId !== "string"
    ) {
      return res.status(400).json({
        error: "deliveryId, orderId, and driverId must be strings",
      });
    }

    // Pick up delivery
    await pickupDelivery(
      deliveryId,
      orderId,
      driverId,
      req.producer,
      "delivery-service"
    );

    res.json({
      message: "Delivery picked up successfully",
      deliveryId,
      orderId,
      driverId,
      pickedUpAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `❌ [delivery-service] Error picking up delivery:`,
      error.message
    );
    res
      .status(500)
      .json({ error: "Failed to pick up delivery", details: error.message });
  }
};

export const completeDeliveryByDriver = async (req, res) => {
  try {
    const { deliveryId, orderId, driverId } = req.body;

    // Validate required fields
    if (!deliveryId || !orderId || !driverId) {
      return res.status(400).json({
        error: "Missing required fields: deliveryId, orderId, driverId",
      });
    }

    // Validate data types
    if (
      typeof deliveryId !== "string" ||
      typeof orderId !== "string" ||
      typeof driverId !== "string"
    ) {
      return res.status(400).json({
        error: "deliveryId, orderId, and driverId must be strings",
      });
    }

    // Complete delivery
    await completeDelivery(
      deliveryId,
      orderId,
      driverId,
      req.producer,
      "delivery-service"
    );

    res.json({
      message: "Delivery completed successfully",
      deliveryId,
      orderId,
      driverId,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `❌ [delivery-service] Error completing delivery:`,
      error.message
    );
    res
      .status(500)
      .json({ error: "Failed to complete delivery", details: error.message });
  }
};

// Toggle driver's own availability (online/offline)
export const toggleMyAvailability = async (req, res) => {
  try {
    const userId = req.user?.userId; // From JWT token
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        error: "isAvailable must be a boolean",
      });
    }

    // Get driver record by userId
    const driver = await getDriverByUserId(userId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Check if driver has an active delivery
    if (!isAvailable) {
      const activeDeliveries = await getDeliveries({
        driverId: driver.id,
        status: "picked_up",
        limit: 1,
      });

      if (activeDeliveries.length > 0) {
        return res.status(400).json({
          error: "Cannot go offline while on an active delivery",
        });
      }
    }

    // Update availability
    await updateDriverAvailability(driver.id, isAvailable);

    logger.info("Driver availability updated", {
      driverId: driver.id,
      isAvailable,
    });

    res.json({
      message: `Driver is now ${isAvailable ? "online" : "offline"}`,
      isAvailable,
    });
  } catch (error) {
    logger.error("Error toggling driver availability", {
      error: error.message,
    });
    res.status(500).json({
      error: "Failed to update availability",
      details: error.message,
    });
  }
};

// Accept delivery
export const acceptDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const userId = req.user?.userId; // From JWT token

    // Get driver record
    const driver = await getDriverByUserId(userId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Get delivery
    const delivery = await getDelivery(deliveryId);
    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    // Verify delivery is assigned to this driver
    // delivery.driverId stores the user ID (driver.id now equals user.id)
    if (delivery.driverId !== driver.id) {
      return res.status(403).json({
        error: "This delivery is not assigned to you",
      });
    }

    // Verify delivery is in pending status
    if (delivery.acceptanceStatus !== "pending") {
      return res.status(400).json({
        error: `Delivery is already ${delivery.acceptanceStatus}`,
      });
    }

    // Accept the delivery
    await acceptDeliveryRepo(deliveryId, driver.id);

    // Set driver to unavailable
    await updateDriverAvailability(driver.id, false);

    logger.info("Delivery accepted", {
      deliveryId,
      driverId: driver.id,
    });

    // Publish event
    await publishMessage(
      req.producer,
      TOPICS.DELIVERY_ACCEPTED,
      {
        deliveryId,
        orderId: delivery.orderId,
        driverId: driver.id,
        driverName: driver.name,
        timestamp: new Date().toISOString(),
      },
      delivery.orderId
    );

    res.json({
      message: "Delivery accepted successfully",
      deliveryId,
    });
  } catch (error) {
    logger.error("Error accepting delivery", {
      error: error.message,
    });
    res.status(500).json({
      error: "Failed to accept delivery",
      details: error.message,
    });
  }
};

// Decline delivery
export const declineDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId; // From JWT token

    // Get driver record
    const driver = await getDriverByUserId(userId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Get delivery
    const delivery = await getDelivery(deliveryId);
    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    // Verify delivery is assigned to this driver
    // delivery.driverId stores the user ID (driver.id now equals user.id)
    if (delivery.driverId !== driver.id) {
      return res.status(403).json({
        error: "This delivery is not assigned to you",
      });
    }

    // Verify delivery is in pending status
    if (delivery.acceptanceStatus !== "pending") {
      return res.status(400).json({
        error: `Cannot decline: delivery is already ${delivery.acceptanceStatus}`,
      });
    }

    // Decline the delivery
    await declineDeliveryRepo(deliveryId, driver.id);

    // Set driver back to available
    await updateDriverAvailability(driver.id, true);

    logger.info("Delivery declined", {
      deliveryId,
      driverId: driver.id,
      reason,
    });

    // Publish event
    await publishMessage(
      req.producer,
      TOPICS.DELIVERY_DECLINED,
      {
        deliveryId,
        orderId: delivery.orderId,
        driverId: driver.id,
        driverName: driver.name,
        reason,
        timestamp: new Date().toISOString(),
      },
      delivery.orderId
    );

    // Trigger reassignment
    const declinedByDrivers = delivery.declinedByDrivers || [];
    declinedByDrivers.push(driver.id);

    await reassignDelivery(
      delivery.orderId,
      deliveryId,
      declinedByDrivers,
      req.producer,
      "delivery-service"
    );

    res.json({
      message: "Delivery declined successfully. Reassigning to another driver.",
      deliveryId,
    });
  } catch (error) {
    logger.error("Error declining delivery", {
      error: error.message,
    });
    res.status(500).json({
      error: "Failed to decline delivery",
      details: error.message,
    });
  }
};

// Get full delivery details
export const getDeliveryDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await getDeliveryWithFullDetails(deliveryId);
    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    logger.info("Delivery details retrieved", {
      deliveryId,
    });

    res.json({
      message: "Delivery details retrieved successfully",
      delivery,
    });
  } catch (error) {
    logger.error("Error getting delivery details", {
      error: error.message,
    });
    res.status(500).json({
      error: "Failed to get delivery details",
      details: error.message,
    });
  }
};
