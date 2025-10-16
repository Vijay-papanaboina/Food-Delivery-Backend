import express from "express";
import cors from "cors";
import buildRoutes from "./routes/index.routes.js";
import { pool, getRestaurantStats } from "./config/db.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "restaurant-service";

function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Database will be used for all restaurant storage

  // Mount routes
  app.use('/', buildRoutes());

  // Health check endpoint
  app.get("/health", async (req, res) => {
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
