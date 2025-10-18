import dotenv from "dotenv";
dotenv.config();

import createApp from "./app.js";
import { createProducer, createConsumer } from "./config/kafka.js";
import { initDb } from "./config/db.js";
import { initializeKafka, shutdownKafka } from "./utils/kafka.utils.js";

/**
 * Delivery Service - Manages order deliveries and driver assignments
 *
 * This service handles:
 * - Assigning delivery drivers to confirmed orders
 * - Tracking delivery status
 * - Completing deliveries
 * - Publishing delivery events to Kafka
 * - Consuming food-ready events
 *
 * Port: 5004
 * Kafka Producer: Publishes to 'delivery-assigned', 'delivery-completed' topics
 * Kafka Consumer: Listens to 'food-ready' topic
 */

const PORT = process.env.PORT || 5004;
const SERVICE_NAME = process.env.SERVICE_NAME || "delivery-service";

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
  console.log(`🚗 [${SERVICE_NAME}] Available endpoints:`);
  console.log(`   POST /api/delivery/assign - Assign delivery manually`);
  console.log(`   POST /api/delivery/pickup - Pick up delivery manually`);
  console.log(`   POST /api/delivery/complete - Complete delivery manually`);
  console.log(`   GET  /api/delivery/:orderId - Get delivery by order ID`);
  console.log(`   GET  /api/delivery - List all deliveries`);
  console.log(`   GET  /api/drivers - List all drivers`);
  console.log(`   GET  /api/delivery/stats - Get delivery statistics`);
  console.log(`   GET  /health - Health check`);

  // Initialize Kafka after server starts
  await initializeKafka(producer, consumer, SERVICE_NAME);
});
