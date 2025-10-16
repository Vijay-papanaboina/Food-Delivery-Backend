import express from "express";
import cors from "cors";
import buildRoutes from "./routes/index.routes.js";
import { db } from "./config/db.js";
import { sql } from "drizzle-orm";

const SERVICE_NAME = process.env.SERVICE_NAME || "payment-service";

function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Database will be used for all payment storage

  // Mount routes
  app.use('/', buildRoutes());

  // Health check endpoint
  app.get("/health", async (req, res) => {
    const result = await db.execute(sql`SELECT COUNT(*)::int as count FROM payment_svc.payments`);
    const count = result.rows ? result.rows[0].count : result[0].count;
    res.json({
      service: SERVICE_NAME,
      status: "healthy",
      port: process.env.PORT || 5002,
      paymentsCount: count,
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
