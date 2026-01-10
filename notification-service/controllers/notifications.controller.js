import {
  listNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
  getNotificationStatsService,
} from "../services/notification.service.js";

export const listNotifications = async (req, res) => {
  try {
    const { userId, type, priority, read, limit = 50 } = req.query;
    
    // Validate query parameters
    const filters = {};
    if (userId) {
      if (typeof userId !== 'string') {
        return res.status(400).json({ error: "userId must be a string" });
      }
      filters.userId = userId;
    }
    if (type) {
      if (typeof type !== 'string') {
        return res.status(400).json({ error: "type must be a string" });
      }
      filters.type = type;
    }
    if (priority) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ error: "priority must be 'low', 'medium', or 'high'" });
      }
      filters.priority = priority;
    }
    if (read !== undefined) {
      if (read !== 'true' && read !== 'false') {
        return res.status(400).json({ error: "read must be 'true' or 'false'" });
      }
      filters.read = read === 'true';
    }
    if (limit) {
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 1000) {
        return res.status(400).json({ error: "limit must be a positive integer between 1 and 1000" });
      }
      filters.limit = parsedLimit;
    }
    
    const result = await listNotificationsService(filters);
    res.json(result);
  } catch (error) {
    console.error(`❌ [notification-service] Error retrieving notifications:`, error.message);
    res.status(500).json({ error: "Failed to retrieve notifications", details: error.message });
  }
};

export const getNotificationById = (req, res) => {
  return res.status(501).json({ error: "Not implemented" });
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await markNotificationReadService(id);
    res.json(result);
  } catch (error) {
    console.error(`❌ [notification-service] Error marking notification read:`, error.message);
    res.status(500).json({ error: "Failed to mark notification read", details: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await markAllNotificationsReadService(userId);
    res.json(result);
  } catch (error) {
    console.error(`❌ [notification-service] Error marking all notifications read:`, error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to mark all notifications read", details: error.message });
  }
};

export const notificationStats = async (req, res) => {
  try {
    const stats = await getNotificationStatsService();
    res.json({ message: "Notification statistics (simulated)", stats });
  } catch (error) {
    console.error(`❌ [notification-service] Error getting stats:`, error.message);
    res.status(500).json({ error: "Failed to get stats", details: error.message });
  }
};