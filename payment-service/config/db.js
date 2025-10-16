import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
// db.js should only expose the Drizzle client

export const db = drizzle(process.env.DATABASE_URL);

export async function initDb() {
  console.log("[payment-service] Drizzle DB initialized");
}

// No re-exports; import repositories directly where needed

