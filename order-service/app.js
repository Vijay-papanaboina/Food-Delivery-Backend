import express from "express";
import cors from "cors";
import buildRoutes from "./routes/index.routes.js";
import { getOrdersCount } from "./repositories/orders.stats.repo.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "order-service";

function createApp(producer) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Database will be used for all order storage

  // Mount routes
  app.use('/', buildRoutes({ producer, serviceName: SERVICE_NAME }));

  // Health check endpoint
  app.get("/health", async(req, res) => {
    const count = await getOrdersCount();
    res.json({
      service: SERVICE_NAME,
      status: "healthy",
      port: process.env.PORT || 5001,
      ordersCount: count,
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
