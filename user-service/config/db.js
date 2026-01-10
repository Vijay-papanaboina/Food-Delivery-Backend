import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

export async function initDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      dbName: "user_service", // Separate database for user service
    });
    console.log("[user-service] MongoDB connected successfully");
  } catch (error) {
    console.error("[user-service] MongoDB connection error:", error);
    process.exit(1);
  }
}

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("[user-service] MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("[user-service] MongoDB error:", err);
});

export const db = mongoose.connection;
