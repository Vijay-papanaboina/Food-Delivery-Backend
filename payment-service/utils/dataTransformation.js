/**
 * Transform payment document to API response format
 * @param {Object} payment - The raw payment document (lean)
 * @returns {Object} Transformed payment object
 */
export const transformPayment = (payment) => {
  if (!payment) return null;

  return {
    id: payment.id,
    paymentId: payment.id, // Keep for backward compatibility
    orderId: payment.orderId?.toString(),
    userId: payment.userId?.toString(),
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    transactionId: payment.transactionId,
    metadata: payment.metadata,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};
