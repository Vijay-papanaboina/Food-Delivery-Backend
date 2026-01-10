import "dotenv/config";
import createApp from "./app.js";
import { createProducer, createConsumer } from "./config/kafka.js";
import { initDb } from "./config/db.js"; // Updated to use Mongoose
import { initializeKafka, shutdownKafka } from "./utils/kafka.utils.js";

/**
 * Payment Service - Processes payments for food orders
 *
 * This service handles:
 * - Processing payments for orders
 * - Simulating payment success/failure scenarios
 * - Publishing payment events to Kafka
 * - Consuming order-created events to auto-process payments
 *
 * Port: 5002
 * Kafka Producer: Publishes to 'payment-processed' topic
 * Kafka Consumer: Listens to 'order-created' topic
 */

const PORT = process.env.PORT || 5002;
const SERVICE_NAME = process.env.SERVICE_NAME || "payment-service";

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
  console.log(`💳 [${SERVICE_NAME}] Available endpoints:`);
  console.log(`   POST /api/payments - Process payment manually`);
  console.log(`   GET  /api/payments/:orderId - Get payment by order ID`);
  console.log(`   GET  /api/payments - List all payments`);
  console.log(`   GET  /api/payments/stats - Get payment statistics`);
  console.log(`   GET  /api/payments/methods - Get available payment methods`);
  console.log(`   GET  /health - Health check`);

  // Initialize Kafka after server starts
  await initializeKafka(producer, consumer, SERVICE_NAME);
});
