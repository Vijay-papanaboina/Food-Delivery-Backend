import {
  createOrder,
  getOrderByIdService,
  listOrdersService,
  getOrderStatsService,
  getRestaurantOrderStatsService,
  updateOrderStatusService,
} from "../services/order.service.js";
import { logger } from "../utils/logger.js";

export const buildCreateOrderController =
  (producer, serviceName) => async (req, res) => {
    const userId = req.user?.userId; // Get user ID from JWT token
    
    try {
      const order = await createOrder(userId, req.body, producer);
      
      res.status(201).json({
        message: "Order created successfully",
        order,
      });
    } catch (error) {
      logger.error("Order creation failed", {
        error: error.message,
        stack: error.stack,
        userId,
        restaurantId: req.body.restaurantId,
      });
      console.error(`❌ [${serviceName}] Error creating order:`, error.message);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({ 
          error: error.message, 
          details: error.details, 
          reason: error.reason 
        });
      }
      
      res.status(500).json({ error: "Failed to create order", details: error.message });
    }
  };

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderByIdService(id);
    res.json({ message: "Order retrieved successfully", order });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to retrieve order", details: error.message });
  }
};

export const listOrders = async (req, res) => {
  try {
    const { status, limit } = req.query;
    const userId = req.user.userId; // Get user ID from JWT token

    const orders = await listOrdersService(userId, status, limit);
    res.json({
      message: "Orders retrieved successfully",
      orders,
      total: orders.length,
    });
  } catch (error) {
    console.error(`❌ [order-service] Error retrieving orders:`, error.message);
    res
      .status(500)
      .json({ error: "Failed to retrieve orders", details: error.message });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const stats = await getOrderStatsService();
    res.json({ message: "Order statistics retrieved successfully", stats });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve order statistics",
      details: error.message,
    });
  }
};

export const getRestaurantOrderStatsController = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const stats = await getRestaurantOrderStatsService(restaurantId);
    res.json({
      message: "Restaurant order statistics retrieved successfully",
      stats,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve restaurant order statistics",
      details: error.message,
    });
  }
};

export const updateOrderStatusController = async (req, res) => {
  const { orderId } = req.params;
  const { status, paymentStatus } = req.body;

  try {
    const updatedOrder = await updateOrderStatusService(orderId, status, paymentStatus);
    res.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    logger.error("Failed to update order status", {
      orderId,
      error: error.message,
    });
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Failed to update order status", details: error.message });
  }
};