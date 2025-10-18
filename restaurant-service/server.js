import dotenv from "dotenv";
dotenv.config({ silent: true });

import createApp from "./app.js";
import { createProducer, createConsumer } from "./config/kafka.js";
import { initDb } from "./config/db.js";
import { initializeKafka, shutdownKafka } from "./utils/kafka.utils.js";

/**
 * Restaurant Service - Manages restaurants, menus, and kitchen operations
 *
 * This service handles:
 * - Managing restaurant information and menus
 * - Processing kitchen orders
 * - Simulating food preparation times
 * - Publishing food-ready events
 * - Consuming order-confirmed events
 *
 * Port: 5006
 * Kafka Producer: Publishes to 'food-ready' topic
 * Kafka Consumer: Listens to 'order-confirmed' topic
 */

const PORT = process.env.PORT || 5006;
const SERVICE_NAME = process.env.SERVICE_NAME || "restaurant-service";

// Kafka setup
const producer = createProducer(SERVICE_NAME);
const consumer = createConsumer(SERVICE_NAME);

// Graceful shutdown
process.on("SIGINT", async () => {
  await shutdownKafka(producer, consumer, SERVICE_NAME);
  process.exit(0);
});

// Initialize DB before accepting traffic
await initDb();

// Create app with producer
const app = createApp(producer);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 [${SERVICE_NAME}] Server running on port ${PORT}`);
  console.log(`🍽️ [${SERVICE_NAME}] Available endpoints:`);
  console.log(`   GET  /api/restaurants - List all restaurants`);
  console.log(`   GET  /api/restaurants/:id - Get restaurant by ID`);
  console.log(`   GET  /api/restaurants/:id/menu - Get restaurant menu`);
  console.log(`   GET  /api/kitchen/orders - List kitchen orders`);
  console.log(
    `   POST /api/kitchen/orders/:orderId/ready - Mark order as ready`
  );
  console.log(`   GET  /health - Health check`);

  // Initialize Kafka after server starts
  await initializeKafka(producer, consumer, SERVICE_NAME);
});
