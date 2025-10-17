import {
  createProducer,
  createConsumer,
  connectProducer,
  connectConsumer,
  disconnectProducer,
  disconnectConsumer,
  subscribeToTopics,
  logConsumerMessage,
  TOPICS,
} from "../config/kafka.js";

/**
 * Initialize Kafka connections and start consuming messages
 */
export async function initializeKafka(producer, consumer, serviceName) {
  try {
    // Connect producer and consumer
    await connectProducer(producer, serviceName);
    await connectConsumer(consumer, serviceName);

    // Payment service no longer consumes any topics - only produces events
    // All payment processing is now manual via API endpoints

    console.log(
      `🚀 [${serviceName}] Kafka producer initialized (no consumer needed)`
    );
  } catch (error) {
    console.error(
      `❌ [${serviceName}] Failed to initialize Kafka:`,
      error.message
    );
    process.exit(1);
  }
}

/**
 * Graceful shutdown of Kafka connections
 */
export async function shutdownKafka(producer, consumer, serviceName) {
  console.log(`\n🛑 [${serviceName}] Shutting down gracefully...`);

  try {
    await disconnectProducer(producer, serviceName);
    await disconnectConsumer(consumer, serviceName);
    console.log(`✅ [${serviceName}] Disconnected from Kafka`);
  } catch (error) {
    console.error(`❌ [${serviceName}] Error during shutdown:`, error.message);
  }
}
