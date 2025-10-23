import express from "express";
import cors from "cors";
import morgan from "morgan";
import buildRoutes from "./routes/index.routes.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "notification-service";

function createApp() {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: process.env.FRONTEND_URL?.split(",") || [
        "http://localhost:5173", // Customers
        "http://localhost:5174", // Restaurants
        "http://localhost:5175", // Delivery
      ],
    })
  );
  app.use(express.json());
  app.use(morgan("dev"));
  // Database will be used for storage, no in-memory storage needed

  // Health check endpoint
  app.get("/api/notification-service/health", async (req, res) => {
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

  // Mount routes with service prefix
  app.use("/api/notification-service", buildRoutes());

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
