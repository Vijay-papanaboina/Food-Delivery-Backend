import 'dotenv/config';

import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, sql } from "drizzle-orm";
import { notifications } from "../db/schema.js";


export const db = drizzle(process.env.DATABASE_URL);


export async function upsertNotification(notification) {
  const row = {
    notificationId: notification.notificationId,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    priority: notification.priority,
    topic: notification.topic || null,
    eventData: notification.eventData ?? null,
    createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
    read: notification.read ?? false,
    readAt: notification.readAt ? new Date(notification.readAt) : null,
    shouldShowToast: notification.shouldShowToast !== false,
  };
  const result = await db
    .insert(notifications)
    .values(row)
    .onConflictDoUpdate({
      target: notifications.notificationId,
      set: {
        userId: row.userId,
        type: row.type,
        title: row.title,
        message: row.message,
        priority: row.priority,
        topic: row.topic,
        eventData: row.eventData,
        read: row.read,
        readAt: row.readAt,
        shouldShowToast: row.shouldShowToast,
      },
    })
    .returning();
  return result[0];
}

export async function getNotification(notificationId) {
  const result = await db.select().from(notifications).where(eq(notifications.notificationId, notificationId)).limit(1);
  return result[0] || null;
}

// Supports the controller's filters signature: { userId, type, priority, read, limit }
export async function getNotifications(filters = {}) {
  let whereExpr = undefined;
  const clauses = [];
  if (filters.userId) clauses.push(eq(notifications.userId, filters.userId));
  if (filters.type) clauses.push(eq(notifications.type, filters.type));
  if (filters.priority) clauses.push(eq(notifications.priority, filters.priority));
  if (filters.read !== undefined) clauses.push(eq(notifications.read, !!filters.read));
  if (clauses.length === 1) whereExpr = clauses[0];
  if (clauses.length > 1) whereExpr = and(...clauses);
  const q = db.select().from(notifications)
    .where(whereExpr)
    .orderBy(desc(notifications.createdAt))
    .limit(filters.limit || 50);
  return await q;
}

export async function markNotificationRead(notificationId) {
  const result = await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(eq(notifications.notificationId, notificationId))
    .returning();
  return result[0] || null;
}

export async function markAllNotificationsReadForUser(userId) {
  const result = await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
    .returning({ notification_id: notifications.notificationId });
  return result.map((r) => r.notification_id);
}

export async function getNotificationStats() {
  const [totals] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      unread: sql<number>`COUNT(*) FILTER (WHERE ${notifications.read} = FALSE)`,
      high_priority: sql<number>`COUNT(*) FILTER (WHERE ${notifications.priority} = 'high')`,
      last_24h: sql<number>`COUNT(*) FILTER (WHERE ${notifications.createdAt} >= NOW() - INTERVAL '24 hours')`,
    })
    .from(notifications);
  return totals;
}