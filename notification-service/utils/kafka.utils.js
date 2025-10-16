import {
  createConsumer,
  connectConsumer,
  disconnectConsumer,
  subscribeToTopics,
  logConsumerMessage,
  ALL_TOPICS,
} from "../config/kafka.js";
import { handleEvent } from "../handlers/notification.handlers.js";

/**
 * Initialize Kafka connections and start consuming messages
 */
export async function initializeKafka(consumer, serviceName) {
  try {
    // Connect consumer
    await connectConsumer(consumer, serviceName);

    // Subscribe to ALL topics for comprehensive notification coverage
    await subscribeToTopics(consumer, ALL_TOPICS);

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          let messageData;
          
          if (message.value === null || message.value === undefined) {
            console.log(`⚠️ [${serviceName}] Received null/undefined message value`);
            return;
          }
          
          // KafkaJS always provides Buffer, convert to string and parse
          try {
            const stringValue = message.value.toString('utf8');
            messageData = JSON.parse(stringValue);
          } catch (parseError) {
            console.error(`❌ [${serviceName}] Failed to parse message:`, parseError.message);
            console.error(`❌ [${serviceName}] Raw value type:`, typeof message.value);
            console.error(`❌ [${serviceName}] Raw value (first 100 chars):`, 
              message.value.toString('utf8').substring(0, 100));
            return;
          }
          logConsumerMessage(
            serviceName,
            topic,
            partition,
            message,
            messageData
          );

          // Handle any event and generate appropriate notification
          await handleEvent(topic, messageData, serviceName);
        } catch (error) {
          console.error(
            `❌ [${serviceName}] Error processing message:`,
            error.message
          );
        }
      },
    });

    console.log(
      `🚀 [${serviceName}] Kafka initialized and consuming messages from all topics`
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
export async function shutdownKafka(consumer, serviceName) {
  console.log(`\n🛑 [${serviceName}] Shutting down gracefully...`);

  try {
    await disconnectConsumer(consumer, serviceName);
    console.log(`✅ [${serviceName}] Disconnected from Kafka`);
  } catch (error) {
    console.error(`❌ [${serviceName}] Error during shutdown:`, error.message);
  }
}
