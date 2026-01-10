import express from "express";
import cors from "cors";
import morgan from "morgan";
import buildRoutes from "./routes/index.routes.js";
import { getOrderStats } from "./repositories/orders.stats.repo.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "order-service";

function createApp(producer) {
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
  // Database will be used for all order storage

  // Health check endpoint
  app.get("/api/order-service/health", async (req, res) => {
    try {
      const stats = await getOrderStats();
      res.json({
        service: SERVICE_NAME,
        status: "healthy",
        port: process.env.PORT || 5001,
        ordersCount: stats.totalOrders || 0,
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

  // Mount routes with service prefix
  app.use("/api/order-service", buildRoutes({ producer, serviceName: SERVICE_NAME }));

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
