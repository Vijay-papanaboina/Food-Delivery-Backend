import express from "express";
import cors from "cors";
import morgan from "morgan";
import buildRoutes from "./routes/index.routes.js";
import { getPaymentsCount } from "./repositories/payments.repo.js";

const SERVICE_NAME = process.env.SERVICE_NAME || "payment-service";

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
  app.use(morgan("dev"));
  // Webhook route needs raw body parsing BEFORE json middleware
  app.use("/api/payment-service/webhooks/stripe", express.raw({ type: "application/json" }));

  app.use(express.json());

  // Make producer available in requests
  app.use((req, res, next) => {
    req.producer = producer;
    next();
  });

  // Database will be used for all payment storage

  // Health check endpoint
  app.get("/api/payment-service/health", async (req, res) => {
    const count = await getPaymentsCount();
    res.json({
      service: SERVICE_NAME,
      status: "healthy",
      port: process.env.PORT || 5002,
      paymentsCount: count,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount routes with service prefix
  app.use("/api/payment-service", buildRoutes());

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
