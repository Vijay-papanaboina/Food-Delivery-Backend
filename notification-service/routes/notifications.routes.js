import { Router } from "express";
import {
  listNotifications,
  getNotificationById,
  markRead,
  markAllRead,
  notificationStats,
} from "../controllers/notifications.controller.js";

export default function notificationsRoutes() {
  const router = Router();
  router.get("/notifications", listNotifications);
  router.get("/notifications/:id", getNotificationById);
  router.put("/notifications/:id/read", markRead);
  router.put("/notifications/read-all", markAllRead);
  router.get("/notifications/stats", notificationStats);
  return router;
}
