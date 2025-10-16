import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { payments } from "../db/schema.js";

export async function upsertPayment(p) {
  await db
    .insert(payments)
    .values({
      paymentId: p.paymentId,
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
      target: payments.paymentId,
      set: {
        status: sql`excluded.status`,
        transactionId: sql`excluded.transaction_id`,
        failureReason: sql`excluded.failure_reason`,
        processedAt: sql`excluded.processed_at`,
      },
    });
}

export async function getPaymentByOrderId(orderId) {
  const rows = await db
    .select({
      payment_id: payments.paymentId,
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
    .limit(1);
  return rows[0] || null;
}

export async function getPayments(filters = {}) {
  let query = db
    .select({
      payment_id: payments.paymentId,
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
  const rows = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'success') as successful,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'processing') as processing,
      SUM(amount) FILTER (WHERE status = 'success') as total_amount,
      AVG(amount) FILTER (WHERE status = 'success') as average_amount
    FROM payment_svc.payments
  `);
  const stats = rows.rows ? rows.rows[0] : rows[0];
  const successRate = stats.total > 0 ? ((Number(stats.successful) / Number(stats.total)) * 100).toFixed(2) : '0.00';
  return {
    total: parseInt(stats.total),
    successful: parseInt(stats.successful),
    failed: parseInt(stats.failed),
    pending: parseInt(stats.pending),
    processing: parseInt(stats.processing),
    totalAmount: parseFloat(stats.total_amount || 0),
    averageAmount: parseFloat(stats.average_amount || 0),
    successRate: parseFloat(successRate)
  };
}


