import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initDb } from "./config/db.js";
import createRoutes from "./routes/index.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;
const SERVICE_NAME = process.env.SERVICE_NAME || "user-service";

// CORS middleware (must come before helmet)
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

// Security middleware
app.use(helmet());

app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 auth requests per windowMs
  message: "Too many authentication attempts, please try again later.",
});

app.use(limiter);

// Cookie parser middleware
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/user-service/health", (req, res) => {
  res.json({
    status: "OK",
    service: SERVICE_NAME,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Mount routes with service prefix
app.use("/api/user-service", createRoutes(SERVICE_NAME));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`❌ [${SERVICE_NAME}] Unhandled error:`, err);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Initialize database and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
  });
});

export default app;
