import { getNotifications, markNotificationRead, markAllNotificationsReadForUser, getNotificationStats } from "../config/db.js";

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
    
    const notifications = await getNotifications(filters);
    const formatted = notifications.map(n => ({
      notificationId: n.notification_id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      topic: n.topic,
      eventData: n.event_data ? (typeof n.event_data === 'string' ? JSON.parse(n.event_data) : n.event_data) : null,
      createdAt: n.created_at,
      read: n.read,
      readAt: n.read_at
    }));
    res.json({ message: "Notifications retrieved successfully", notifications: formatted, total: formatted.length });
  } catch (error) {
    console.error(`❌ [notification-service] Error retrieving notifications:`, error.message);
    res.status(500).json({ error: "Failed to retrieve notifications", details: error.message });
  }
};

export const getNotificationById = (req, res) => {
  // Server previously used in-memory map for GET by id; DB API exposes only list by filters.
  return res.status(501).json({ error: "Not implemented" });
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    await markNotificationRead(id);
    res.json({ message: "Notification marked as read", notificationId: id });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read", details: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing required field: userId" });
    const updated = await markAllNotificationsReadForUser(userId);
    res.json({ message: "All notifications marked as read", updatedCount: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark all notifications as read", details: error.message });
  }
};

export const notificationStats = async (req, res) => {
  try {
    const stats = await getNotificationStats();
    res.json({ message: "Notification statistics retrieved successfully", stats });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve notification statistics", details: error.message });
  }
};


