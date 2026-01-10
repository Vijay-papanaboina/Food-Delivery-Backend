import {
  toggleRestaurantStatusService,
  checkRestaurantStatusService,
  markOrderAsReadyService,
} from "../services/restaurant.service.js";

export const toggleRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { isOpen } = req.body;
    
    const result = await toggleRestaurantStatusService(restaurantId, isOpen);
    
    res.json({
      message: `Restaurant ${result.isOpen ? "opened" : "closed"} successfully`,
      restaurantId: result.restaurantId,
      isOpen: result.isOpen,
    });
  } catch (error) {
    console.error("Error toggling restaurant status:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Failed to toggle restaurant status",
      details: error.message,
    });
  }
};

export const checkRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const status = await checkRestaurantStatusService(restaurantId);
    res.json(status);
  } catch (error) {
    console.error("Error checking restaurant status:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Failed to check restaurant status",
      details: error.message,
    });
  }
};

export const markOrderAsReady = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await markOrderAsReadyService(orderId, req.user.userId, req.producer);

    res.json({
      message: "Order marked as ready successfully",
      orderId: result.orderId,
      readyAt: result.readyAt,
    });
  } catch (error) {
    console.error("Error marking order as ready:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to mark order as ready", details: error.message });
  }
};