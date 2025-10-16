import { pgSchema, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

const notificationSchema = pgSchema("notification_svc");

export const notifications = notificationSchema.table("notifications", {
  notificationId: text("notification_id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull().default("medium"),
  topic: text("topic"),
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  read: boolean("read").default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  shouldShowToast: boolean("should_show_toast").default(true),
});


