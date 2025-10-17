import express from "express";
import cors from "cors";
import buildRoutes from "./routes/index.routes.js";
import { getDeliveryStats, getDrivers } from "./config/db.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "delivery-service";

function createApp(producer) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Make producer available in requests
  app.use((req, res, next) => {
    req.producer = producer;
    next();
  });

  // Database will be used for all delivery storage

  // Mount routes
  app.use("/", buildRoutes());

  // Health check endpoint
  app.get("/health", async (req, res) => {
    try {
      const deliveryStats = await getDeliveryStats();
      const driverStats = await getDrivers();
      const availableDrivers = driverStats.filter((d) => d.is_available).length;

      res.json({
        service: SERVICE_NAME,
        status: "healthy",
        port: process.env.PORT || 5004,
        deliveriesCount: deliveryStats.total || 0,
        driversCount: driverStats.length,
        availableDrivers: availableDrivers,
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
