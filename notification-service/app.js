import express from "express";
import cors from "cors";
import buildRoutes from "./routes/index.routes.js";
import { upsertNotification, getNotificationStats } from "./config/db.js";
import { NOTIFICATION_TEMPLATES } from "./handlers/notification.handlers.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "notification-service";

function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Database will be used for storage, no in-memory storage needed

  // Mount routes
  app.use('/', buildRoutes());

  // Health check endpoint
  app.get("/health", async (req, res) => {
    try {
      const stats = await getNotificationStats();
      res.json({
        service: SERVICE_NAME,
        status: "healthy",
        port: process.env.PORT || 5003,
        notificationsCount: stats.total || 0,
        unreadCount: stats.unread || 0,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        service: SERVICE_NAME,
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error(`❌ [${SERVICE_NAME}] Unhandled error:`, error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  });

  return app;
}

export default createApp;
