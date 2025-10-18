import {
  pgSchema,
  pgTable,
  text,
  timestamp,
  numeric,
  uuid,
} from "drizzle-orm/pg-core";

export const payment_svc = pgSchema("payment_svc");

export const payments = payment_svc.table("payments", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  orderId: uuid("order_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull(),
  userId: uuid("user_id").notNull(),
  status: text("status").notNull(),
  transactionId: text("transaction_id"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});
