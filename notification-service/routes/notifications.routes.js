import { Router } from "express";
import { listNotifications, getNotificationById, markRead, markAllRead, notificationStats } from "../controllers/notifications.controller.js";

export default function notificationsRoutes() {
  const router = Router();
  router.get("/api/notifications", listNotifications);
  router.get("/api/notifications/:id", getNotificationById);
  router.put("/api/notifications/:id/read", markRead);
  router.put("/api/notifications/read-all", markAllRead);
  router.get("/api/notifications/stats", notificationStats);
  return router;
}


