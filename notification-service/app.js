import express from "express";
import cors from "cors";
import morgan from "morgan";
import buildRoutes from "./routes/index.routes.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "notification-service";

function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));
  // Database will be used for storage, no in-memory storage needed

  // Mount routes
  app.use("/", buildRoutes());

  // Health check endpoint
  app.get("/health", async (req, res) => {
    res.json({
      service: SERVICE_NAME,
      status: "healthy",
      port: process.env.PORT || 5003,
      notificationsCount: 0,
      unreadCount: 0,
      simulated: true,
      timestamp: new Date().toISOString(),
    });
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
