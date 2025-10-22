import dotenv from "dotenv";
dotenv.config();

import { Kafka } from "kafkajs";

const clientId = process.env.KAFKA_CLIENT_ID || "delivery-service";
const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

const kafka = new Kafka({
  clientId,
  brokers,
  retry: { initialRetryTime: 100, retries: 8 },
});

export const TOPICS = {
  FOOD_READY: process.env.TOPIC_FOOD_READY || "food-ready",
  DELIVERY_ASSIGNED: process.env.TOPIC_DELIVERY_ASSIGNED || "delivery-assigned",
  DELIVERY_PICKED_UP:
    process.env.TOPIC_DELIVERY_PICKED_UP || "delivery-picked-up",
  DELIVERY_COMPLETED:
    process.env.TOPIC_DELIVERY_COMPLETED || "delivery-completed",
  DELIVERY_ACCEPTED: process.env.TOPIC_DELIVERY_ACCEPTED || "delivery-accepted",
  DELIVERY_DECLINED: process.env.TOPIC_DELIVERY_DECLINED || "delivery-declined",
  DELIVERY_REASSIGNED:
    process.env.TOPIC_DELIVERY_REASSIGNED || "delivery-reassigned",
  DELIVERY_UNASSIGNED:
    process.env.TOPIC_DELIVERY_UNASSIGNED || "delivery-unassigned",
};

export const createProducer = (serviceName) =>
  kafka.producer({ groupId: `${serviceName}-producer` });
export const createConsumer = (serviceName, groupId = null) =>
  kafka.consumer({ groupId: groupId || `${serviceName}-consumer` });
export const connectProducer = async (producer) => producer.connect();
export const connectConsumer = async (consumer) => consumer.connect();
export const disconnectProducer = async (producer) => producer.disconnect();
export const disconnectConsumer = async (consumer) => consumer.disconnect();
export const subscribeToTopics = async (
  consumer,
  topics,
  fromBeginning = false
) => consumer.subscribe({ topics, fromBeginning });
export const publishMessage = async (producer, topic, message, key = null) =>
  producer.send({
    topic,
    messages: [
      {
        key: key || null,
        value: JSON.stringify(message),
        timestamp: Date.now().toString(),
      },
    ],
  });

export const logConsumerMessage = (
  serviceName,
  topic,
  partition,
  message,
  data
) => {
  console.log(
    `📥 [${serviceName}] ${topic} p${partition} o${message.offset} key=${
      message.key?.toString() || "none"
    }`
  );
};

export default kafka;
