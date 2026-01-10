import express from "express";
import cors from "cors";
import morgan from "morgan";
import buildRoutes from "./routes/index.routes.js";
import { getDeliveryStats } from "./repositories/deliveries.repo.js";
import { getDrivers } from "./repositories/drivers.repo.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "delivery-service";

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
  // Make producer available in requests
  app.use((req, res, next) => {
    req.producer = producer;
    next();
  });

  // Database will be used for all delivery storage

  // Health check endpoint
  app.get("/api/delivery-service/health", async (req, res) => {
    try {
      const deliveryStats = await getDeliveryStats();
      const driverStats = await getDrivers();
      const availableDrivers = driverStats.filter((d) => d.isAvailable).length; // camelCase in Mongoose

      res.json({
        service: SERVICE_NAME,
        status: "healthy",
        port: process.env.PORT || 5004,
        deliveriesCount: deliveryStats.totalDeliveries || 0, // Mongoose repo returns totalDeliveries
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

  // Mount routes with service prefix
  app.use("/api/delivery-service", buildRoutes());

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
