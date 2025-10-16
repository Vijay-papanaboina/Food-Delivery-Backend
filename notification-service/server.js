import dotenv from "dotenv";
dotenv.config();

import createApp from "./app.js";
import { createConsumer } from "./config/kafka.js";
import { initializeKafka, shutdownKafka } from "./utils/kafka.utils.js";

/**
 * Notification Service - Sends notifications for all system events
 *
 * This service handles:
 * - Listening to all Kafka topics for events
 * - Generating appropriate notifications for each event type
 * - Simulating notifications via logs (no database persistence)
 * - Providing notification management APIs
 *
 * Port: 5003
 * Kafka Consumer: Listens to ALL topics for comprehensive notification coverage
 */

const PORT = process.env.PORT || 5003;
const SERVICE_NAME = process.env.SERVICE_NAME || "notification-service";

// Kafka setup
const consumer = createConsumer(SERVICE_NAME);


// Graceful shutdown
process.on("SIGINT", async () => {
  await shutdownKafka(consumer, SERVICE_NAME);
  process.exit(0);
});

// No DB initialization needed; simulation/log-only mode

// Create app
const app = createApp();

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 [${SERVICE_NAME}] Server running on port ${PORT}`);
  console.log(`📧 [${SERVICE_NAME}] Available endpoints:`);
  console.log(`   GET  /api/notifications - List notifications`);
  console.log(`   GET  /api/notifications/:id - Get notification by ID`);
  console.log(`   PUT  /api/notifications/:id/read - Mark notification as read`);
  console.log(`   PUT  /api/notifications/read-all - Mark all notifications as read`);
  console.log(`   GET  /api/notifications/stats - Get notification statistics`);
  console.log(`   POST /api/notifications/send - Send custom notification`);
  console.log(`   GET  /health - Health check`);

  // Initialize Kafka after server starts
  await initializeKafka(consumer, SERVICE_NAME);
});