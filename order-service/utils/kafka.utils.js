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
import {
  handlePaymentProcessed,
  handleDeliveryCompleted,
  handleFoodReady,
  handleDeliveryPickedUp,
} from "../handlers/order.handlers.js";

/**
 * Initialize Kafka connections and start consuming messages
 */
export async function initializeKafka(producer, consumer, serviceName) {
  try {
    // Connect producer and consumer
    await connectProducer(producer, serviceName);
    await connectConsumer(consumer, serviceName);

    // Subscribe to topics we need to listen to
    await subscribeToTopics(consumer, [
      TOPICS.PAYMENT_PROCESSED,
      TOPICS.DELIVERY_COMPLETED,
      TOPICS.DELIVERY_PICKED_UP,
      TOPICS.FOOD_READY,
    ]);

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          let messageData;

          if (message.value === null || message.value === undefined) {
            console.log(
              `⚠️ [${serviceName}] Received null/undefined message value`
            );
            return;
          }

          // KafkaJS always provides Buffer, convert to string and parse
          try {
            const stringValue = message.value.toString("utf8");
            messageData = JSON.parse(stringValue);
          } catch (parseError) {
            console.error(
              `❌ [${serviceName}] Failed to parse message:`,
              parseError.message
            );
            console.error(
              `❌ [${serviceName}] Raw value type:`,
              typeof message.value
            );
            console.error(
              `❌ [${serviceName}] Raw value (first 100 chars):`,
              message.value.toString("utf8").substring(0, 100)
            );
            return;
          }
          logConsumerMessage(
            serviceName,
            topic,
            partition,
            message,
            messageData
          );

          switch (topic) {
            case TOPICS.PAYMENT_PROCESSED:
              await handlePaymentProcessed(messageData, producer, serviceName);
              break;
            case TOPICS.DELIVERY_COMPLETED:
              await handleDeliveryCompleted(messageData, producer, serviceName);
              break;
            case TOPICS.DELIVERY_PICKED_UP:
              await handleDeliveryPickedUp(messageData, producer, serviceName);
              break;
            case TOPICS.FOOD_READY:
              await handleFoodReady(messageData, producer, serviceName);
              break;
            default:
              console.log(`⚠️ [${serviceName}] Unknown topic: ${topic}`);
          }
        } catch (error) {
          console.error(
            `❌ [${serviceName}] Error processing message:`,
            error.message
          );
        }
      },
    });

    console.log(`🚀 [${serviceName}] Kafka initialized and consuming messages`);
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
