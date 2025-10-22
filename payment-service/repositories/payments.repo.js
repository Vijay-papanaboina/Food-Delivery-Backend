import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { payments } from "../db/schema.js";

export async function upsertPayment(p) {
  const [result] = await db
    .insert(payments)
    .values({
      paymentId: p.id,
      orderId: p.orderId,
      amount: String(p.amount),
      method: p.method,
      userId: p.userId,
      status: p.status,
      transactionId: p.transactionId || null,
      failureReason: p.failureReason || null,
      createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
      processedAt: p.processedAt ? new Date(p.processedAt) : null,
    })
    .onConflictDoUpdate({
      target: payments.id,
      set: {
        status: sql`excluded.status`,
        transactionId: sql`excluded.transaction_id`,
        failureReason: sql`excluded.failure_reason`,
        processedAt: sql`excluded.processed_at`,
      },
    })
    .returning();

  return result;
}

// Update only selected fields on an existing payment row
export async function updatePaymentFields(paymentId, fields) {
  const updateSet = {};
  if (fields.status !== undefined) updateSet.status = fields.status;
  if (fields.method !== undefined) updateSet.method = fields.method;
  if (fields.processedAt !== undefined)
    updateSet.processedAt = fields.processedAt
      ? new Date(fields.processedAt)
      : null;
  if (fields.transactionId !== undefined)
    updateSet.transactionId = fields.transactionId;
  if (fields.failureReason !== undefined)
    updateSet.failureReason = fields.failureReason;

  await db.update(payments).set(updateSet).where(eq(payments.id, paymentId));
}

export async function getPaymentByOrderId(orderId) {
  const rows = await db
    .select({
      payment_id: payments.id,
      order_id: payments.orderId,
      amount: payments.amount,
      method: payments.method,
      user_id: payments.userId,
      status: payments.status,
      transaction_id: payments.transactionId,
      failure_reason: payments.failureReason,
      created_at: payments.createdAt,
      processed_at: payments.processedAt,
    })
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt)) // ← Get most recent payment
    .limit(1);
  return rows[0] || null;
}

export async function getPayments(filters = {}) {
  let query = db
    .select({
      payment_id: payments.id,
      order_id: payments.orderId,
      amount: payments.amount,
      method: payments.method,
      user_id: payments.userId,
      status: payments.status,
      transaction_id: payments.transactionId,
      failure_reason: payments.failureReason,
      created_at: payments.createdAt,
      processed_at: payments.processedAt,
    })
    .from(payments)
    .orderBy(desc(payments.createdAt));

  const conditions = [];
  if (filters.status) conditions.push(eq(payments.status, filters.status));
  if (filters.method) conditions.push(eq(payments.method, filters.method));
  if (filters.userId) conditions.push(eq(payments.userId, filters.userId));
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  if (filters.limit) {
    query = query.limit(Number(filters.limit));
  }
  return await query;
}

export async function getPaymentStats() {
  const [
    totalRows,
    successRows,
    failedRows,
    pendingRows,
    processingRows,
    sumSuccessRows,
    avgSuccessRows,
  ] = await Promise.all([
    db.select({ count: sql`COUNT(*)` }).from(payments),
    db
      .select({ count: sql`COUNT(*)` })
      .from(payments)
      .where(eq(payments.status, "success")),
    db
      .select({ count: sql`COUNT(*)` })
      .from(payments)
      .where(eq(payments.status, "failed")),
    db
      .select({ count: sql`COUNT(*)` })
      .from(payments)
      .where(eq(payments.status, "pending")),
    db
      .select({ count: sql`COUNT(*)` })
      .from(payments)
      .where(eq(payments.status, "processing")),
    db
      .select({ sum: sql`SUM(${payments.amount})` })
      .from(payments)
      .where(eq(payments.status, "success")),
    db
      .select({ avg: sql`AVG(${payments.amount})` })
      .from(payments)
      .where(eq(payments.status, "success")),
  ]);

  const total = parseInt(totalRows[0]?.count || 0);
  const successful = parseInt(successRows[0]?.count || 0);
  const failed = parseInt(failedRows[0]?.count || 0);
  const pending = parseInt(pendingRows[0]?.count || 0);
  const processing = parseInt(processingRows[0]?.count || 0);
  const totalAmount = parseFloat(sumSuccessRows[0]?.sum || 0);
  const averageAmount = parseFloat(avgSuccessRows[0]?.avg || 0);
  const successRate =
    total > 0 ? parseFloat(((successful / total) * 100).toFixed(2)) : 0;

  return {
    total,
    successful,
    failed,
    pending,
    processing,
    totalAmount,
    averageAmount,
    successRate,
  };
}

export async function getPaymentsCount() {
  const rows = await db.select({ count: sql`COUNT(*)::int` }).from(payments);
  return rows[0]?.count || 0;
}
