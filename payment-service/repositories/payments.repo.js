import { Payment } from "../db/schema.js";

export async function upsertPayment(p) {
  const paymentData = {
    orderId: p.orderId,
    amount: p.amount,
    method: p.method,
    userId: p.userId,
    status: p.status,
    transactionId: p.transactionId || null,
    failureReason: p.failureReason || null,
    createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
    processedAt: p.processedAt ? new Date(p.processedAt) : null,
  };

  // Remove undefined fields
  Object.keys(paymentData).forEach(
    (key) => paymentData[key] === undefined && delete paymentData[key]
  );

  const result = await Payment.findOneAndUpdate(
    { orderId: p.orderId },
    paymentData,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return result.toObject();
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

  await Payment.findByIdAndUpdate(paymentId, updateSet);
}

export async function getPaymentByOrderId(orderId) {
  const payment = await Payment.findOne({ orderId })
    .sort({ createdAt: -1 });

  if (!payment) return null;

  return payment.toObject();
}

export async function getPayments(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.method) query.method = filters.method;
  if (filters.userId) query.userId = filters.userId;

  let q = Payment.find(query).sort({ createdAt: -1 });
  if (filters.limit) {
    q = q.limit(Number(filters.limit));
  }

  const payments = await q;
  return payments.map((p) => p.toObject());
}

export async function getPaymentStats() {
  const [
    total,
    successful,
    failed,
    pending,
    processing,
    sumSuccess,
    avgSuccess,
  ] = await Promise.all([
    Payment.countDocuments(),
    Payment.countDocuments({ status: "success" }),
    Payment.countDocuments({ status: "failed" }),
    Payment.countDocuments({ status: "pending" }),
    Payment.countDocuments({ status: "processing" }),
    Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, avg: { $avg: "$amount" } } },
    ]),
  ]);

  const totalAmount = sumSuccess.length > 0 ? sumSuccess[0].total : 0;
  const averageAmount = avgSuccess.length > 0 ? avgSuccess[0].avg : 0;
  const successRate =
    total > 0 ? parseFloat(((successful / total) * 100).toFixed(2)) : 0;

  return {
    total,
    successful,
    failed,
    pending,
    processing,
    totalAmount: Number(totalAmount.toFixed(2)),
    averageAmount: Number(averageAmount.toFixed(2)),
    successRate,
  };
}

export async function getPaymentsCount() {
  return await Payment.countDocuments();
}
