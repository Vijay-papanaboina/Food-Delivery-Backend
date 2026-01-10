import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const initDb = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI|| process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ [delivery-service] Connected to MongoDB");

    mongoose.connection.on("error", (err) => {
      console.error("❌ [delivery-service] MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ [delivery-service] MongoDB disconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🛑 [delivery-service] MongoDB connection closed");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ [delivery-service] Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};
