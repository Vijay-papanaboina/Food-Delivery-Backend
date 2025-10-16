import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { upsertPayment, getPaymentByOrderId, getPayments, getPaymentStats } from "../repositories/payments.repo.js";

export const db = drizzle(process.env.DATABASE_URL);

export async function initDb() {
  console.log("[payment-service] Drizzle DB initialized");
}

export { upsertPayment, getPaymentByOrderId, getPayments, getPaymentStats };

