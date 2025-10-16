import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(process.env.DATABASE_URL);

export async function initDb() {
  console.log("[restaurant-service] Drizzle DB initialized");
}