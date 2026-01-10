import { Order } from "../db/schema.js";
import { logger } from "../utils/logger.js";

export async function getUserOrders(userId, filters = {}) {
  try {
    const { status, limit = 10 } = filters;
    const query = { userId };
    
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return orders.map(order => order.toObject());
  } catch (error) {
    logger.error("Failed to get user orders", { userId, error: error.message });
    throw error;
  }
}

export async function getRestaurantOrders(restaurantId, limit = 10) {
  try {
    const orders = await Order.find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return orders.map(order => order.toObject());
  } catch (error) {
    logger.error("Failed to get restaurant orders", {
      restaurantId,
      error: error.message,
    });
    throw error;
  }
}

export async function getOrderStats() {
  try {
    const total = await Order.countDocuments();

    const deliveredRevenue = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]);

    const byStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const byRestaurant = await Order.aggregate([
      { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
    ]);

    return {
      total,
      totalRevenue: deliveredRevenue[0]?.revenue || 0,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      byRestaurant: Object.fromEntries(
        byRestaurant.map((r) => [r._id, r.count])
      ),
    };
  } catch (error) {
    logger.error("Failed to get order stats", { error: error.message });
    throw error;
  }
}

export async function getRestaurantOrderStats(restaurantId) {
  try {
    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
    ]);

    // Average preparation time (mock data for now)
    const avgPrepTime = 15;

    return {
      todayOrders: stats[0]?.count || 0,
      todayRevenue: (stats[0]?.revenue || 0).toFixed(2),
      averagePreparationTime: avgPrepTime,
    };
  } catch (error) {
    logger.error("Failed to get restaurant order stats", {
      restaurantId,
      error: error.message,
    });
    throw error;
  }
}


