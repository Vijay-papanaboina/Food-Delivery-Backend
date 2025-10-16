import dotenv from "dotenv";
dotenv.config();

import { Kafka } from "kafkajs";

const clientId = process.env.KAFKA_CLIENT_ID || "payment-service";
const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

const kafka = new Kafka({ clientId, brokers, retry: { initialRetryTime: 100, retries: 8 } });

export const TOPICS = {
  ORDER_CREATED: process.env.TOPIC_ORDER_CREATED || "order-created",
  PAYMENT_PROCESSED: process.env.TOPIC_PAYMENT_PROCESSED || "payment-processed",
};

export const createProducer = (serviceName) => kafka.producer({ groupId: `${serviceName}-producer` });
export const createConsumer = (serviceName, groupId = null) => kafka.consumer({ groupId: groupId || `${serviceName}-consumer` });
export const connectProducer = async (producer) => producer.connect();
export const connectConsumer = async (consumer) => consumer.connect();
export const disconnectProducer = async (producer) => producer.disconnect();
export const disconnectConsumer = async (consumer) => consumer.disconnect();
export const subscribeToTopics = async (consumer, topics, fromBeginning = false) => consumer.subscribe({ topics, fromBeginning });
export const publishMessage = async (producer, topic, message, key = null) =>
  producer.send({ topic, messages: [{ key: key || null, value: JSON.stringify(message), timestamp: Date.now().toString() }] });

export const logConsumerMessage = (serviceName, topic, partition, message, data) => {
  console.log(`📥 [${serviceName}] ${topic} p${partition} o${message.offset} key=${message.key?.toString() || "none"}`);
};

export default kafka;


