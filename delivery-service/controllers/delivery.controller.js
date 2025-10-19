import {
  getDeliveryByOrderId,
  getDeliveries,
  getDeliveryStats,
} from "../repositories/deliveries.repo.js";
import { getDrivers } from "../repositories/drivers.repo.js";
import {
  assignDelivery,
  pickupDelivery,
  completeDelivery,
} from "../handlers/delivery.handlers.js";
import { createLogger, sanitizeForLogging } from "../../shared/utils/logger.js";

export const getDeliveryByOrder = async (req, res) => {
  const logger = createLogger("delivery-service");

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
    const { status, driverId, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (driverId) filters.driverId = driverId;
    if (limit) filters.limit = parseInt(limit);
    const deliveries = await getDeliveries(filters);
    res.json({
      message: "Deliveries retrieved successfully",
      deliveries,
      total: deliveries.length,
    });
  } catch (error) {
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
    const stats = await getDeliveryStats();
    res.json({ message: "Delivery statistics retrieved successfully", stats });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve delivery statistics",
      details: error.message,
    });
  }
};

export const assignDeliveryToDriver = async (req, res) => {
  try {
    const { orderId, driverId, deliveryAddress } = req.body;

    // Validate required fields
    if (!orderId || !driverId || !deliveryAddress) {
      return res.status(400).json({
        error: "Missing required fields: orderId, driverId, deliveryAddress",
      });
    }

    // Validate data types
    if (typeof orderId !== "string" || typeof driverId !== "string") {
      return res.status(400).json({
        error: "orderId and driverId must be strings",
      });
    }

    if (typeof deliveryAddress !== "object" || deliveryAddress === null) {
      return res.status(400).json({
        error: "deliveryAddress must be an object",
      });
    }

    // Assign delivery
    const deliveryId = await assignDelivery(
      orderId,
      driverId,
      deliveryAddress,
      req.producer,
      "delivery-service"
    );

    res.status(201).json({
      message: "Delivery assigned successfully",
      deliveryId,
      orderId,
      driverId,
      assignedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `❌ [delivery-service] Error assigning delivery:`,
      error.message
    );
    res
      .status(500)
      .json({ error: "Failed to assign delivery", details: error.message });
  }
};

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
