import express from "express";
import cors from "cors";
import morgan from "morgan";
import buildRoutes from "./routes/index.routes.js";
import { getRestaurantStats } from "./repositories/restaurants.repo.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "restaurant-service";

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
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(morgan("dev"));
  // Make producer available in requests
  app.use((req, res, next) => {
    req.producer = producer;
    next();
  });

  // Database will be used for all restaurant storage

  // Health check endpoint
  app.get("/api/restaurant-service/health", async (req, res) => {
    try {
      const stats = await getRestaurantStats();
      res.json({
        service: SERVICE_NAME,
        status: "healthy",
        port: process.env.PORT || 5006,
        restaurantsCount: stats.total || 0,
        activeRestaurants: stats.active || 0,
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
  app.use("/api/restaurant-service", buildRoutes(producer));

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
