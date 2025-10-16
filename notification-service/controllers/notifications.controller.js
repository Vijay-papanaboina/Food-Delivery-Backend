// DB removed: simulate notifications via logs and mock responses

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
    
    console.log(`[notification-service] listNotifications filters=`, filters);
    res.json({ message: "Notifications are simulated; no persistence", notifications: [], total: 0 });
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
  const { id } = req.params;
  console.log(`[notification-service] markRead id=${id}`);
  res.json({ message: "Notification marked as read (simulated)", notificationId: id });
};

export const markAllRead = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing required field: userId" });
  console.log(`[notification-service] markAllRead userId=${userId}`);
  res.json({ message: "All notifications marked as read (simulated)", updatedCount: 0 });
};

export const notificationStats = async (req, res) => {
  const stats = { total: 0, unread: 0, byType: {}, byPriority: {} };
  res.json({ message: "Notification statistics (simulated)", stats });
};


