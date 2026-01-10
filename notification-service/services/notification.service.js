import { logger } from "../utils/logger.js";

export const listNotificationsService = async (filters) => {
  // Logic to filter notifications would go here if we had a DB.
  // Currently, it just logs and returns empty as per original implementation.
  
  logger.info("Listing notifications with filters", { filters });
  
  return {
    message: "Notifications are simulated; no persistence",
    notifications: [],
    total: 0,
  };
};

export const markNotificationReadService = async (id) => {
  logger.info("Marking notification as read", { notificationId: id });
  return {
    message: "Notification marked as read (simulated)",
    notificationId: id,
  };
};

export const markAllNotificationsReadService = async (userId) => {
  if (!userId) {
    const error = new Error("Missing required field: userId");
    error.statusCode = 400;
    throw error;
  }
  
  logger.info("Marking all notifications as read", { userId });
  
  return {
    message: "All notifications marked as read (simulated)",
    updatedCount: 0,
  };
};

export const getNotificationStatsService = async () => {
  return {
    total: 0,
    unread: 0,
    byType: {},
    byPriority: {},
  };
};
