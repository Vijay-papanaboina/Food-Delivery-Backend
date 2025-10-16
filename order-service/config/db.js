import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { upsertOrder, getOrder } from "../repositories/orders.repo.js";

export const db = drizzle(process.env.DATABASE_URL);

export async function initDb() {
  console.log("[order-service] Drizzle DB initialized");
}

export { upsertOrder, getOrder };


