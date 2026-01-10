import mongoose from "mongoose";
import {
  usersData,
  restaurantsData,
  menuItemsData,
  driversData,
} from "./mock-data.js";
import { userSchema } from "./user-service/db/schema.js";
import { driverSchema } from "./delivery-service/db/schema.js";
import { restaurantSchema, menuItemSchema } from "./restaurant-service/db/schema.js";

// MongoDB connection URLs
const MONGO_URI_USERS = "mongodb://admin:admin123@localhost:27017/user_service?authSource=admin";
const MONGO_URI_RESTAURANTS = "mongodb://admin:admin123@localhost:27017/restaurant_service?authSource=admin";
const MONGO_URI_DRIVERS = "mongodb://admin:admin123@localhost:27017/delivery_service?authSource=admin";

// ==========================================
// SEED FUNCTION
// ==========================================

async function seedDatabase(Schema, URI, data, modelName) {
  let conn = null;
  try {
    console.log(`\n🔄 Seeding ${modelName}...`);
    console.log(`📍 Connecting to ${URI.split('@')[1]}...`);
    
    // Create a separate connection for this database
    conn = await mongoose.createConnection(URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    }).asPromise();
    
    console.log("✅ Connected!");

    // Create a model bound to this connection
    const Model = conn.model(modelName, Schema);

    // Clear existing data
    await Model.deleteMany({});

    console.log(`📝 Inserting ${data.length} ${modelName.toLowerCase()}...`);
    
    const result = await Model.insertMany(data);
    
    console.log(`✅ Successfully inserted ${result.length} ${modelName.toLowerCase()}!`);
    
  } catch (error) {
    console.error(`\n❌ Error seeding ${modelName}:`, error.message);
    throw error;
  } finally {
    if (conn) {
      await conn.close();
      console.log(`🔌 Connection closed`);
    }
  }
}

// Run the seeding scripts sequentially
(async () => {
  try {
    console.log("🌱 Starting MongoDB seeding process...\n");
    console.log("=" .repeat(50));

    // Seed User Service
    await seedDatabase(userSchema, MONGO_URI_USERS, usersData, "User");

    // Seed Delivery Service
    await seedDatabase(driverSchema, MONGO_URI_DRIVERS, driversData, "Driver");

    // Seed Restaurant Service - Restaurants
    await seedDatabase(restaurantSchema, MONGO_URI_RESTAURANTS, restaurantsData, "Restaurant");

    // Seed Restaurant Service - Menu Items
    await seedDatabase(menuItemSchema, MONGO_URI_RESTAURANTS, menuItemsData, "MenuItem");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 All database seeding completed successfully!\n");
    console.log('📋 Test Credentials (all passwords: "password"):');
    console.log("   Customer: john@example.com");
    console.log("   Restaurant Owner: mario@pizzapalace.com");
    console.log("   Driver: john.smith@driver.com");
    console.log("\n" + "=".repeat(50));
    
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
    process.exit(1);
  }
})();
