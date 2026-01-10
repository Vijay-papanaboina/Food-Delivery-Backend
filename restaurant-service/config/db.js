import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const initDb = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    await mongoose.connect(mongoUri, {
      dbName: "restaurant_service",
    });

    logger.info("MongoDB connected successfully");

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
