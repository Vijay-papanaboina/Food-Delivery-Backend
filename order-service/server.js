import dotenv from "dotenv";
dotenv.config({ silent: true });

import createApp from "./app.js";
import {
  createProducer,
  createConsumer,
} from "./config/kafka.js";
import { initDb } from "./config/db.js";
import { initializeKafka, shutdownKafka } from "./utils/kafka.utils.js";

/**
 * Order Service - Manages food orders in the microservices system
 *
 * This service handles:
 * - Creating new orders
 * - Retrieving order details
 * - Updating order status based on payment and delivery events
 * - Publishing order events to Kafka
 * - Consuming payment and delivery events
 *
 * Port: 5001
 * Kafka Producer: Publishes to 'order-created' topic
 * Kafka Consumer: Listens to 'payment-processed', 'delivery-completed' topics
 */

const PORT = process.env.PORT || 5001;
const SERVICE_NAME = process.env.SERVICE_NAME || "order-service";

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
  console.log(`📋 [${SERVICE_NAME}] Available endpoints:`);
  console.log(`   POST /api/orders - Create new order`);
  console.log(`   GET  /api/orders/:id - Get order by ID`);
  console.log(`   GET  /api/orders - List all orders`);
  console.log(`   GET  /api/orders/stats - Get order statistics`);
  console.log(`   GET  /health - Health check`);

  // Initialize Kafka after server starts
  await initializeKafka(producer, consumer, SERVICE_NAME);
});
