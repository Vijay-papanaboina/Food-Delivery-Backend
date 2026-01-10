/**
 * Transform order document to API response format
 * @param {Object} order - The raw order document (lean)
 * @returns {Object} Transformed order object
 */
export const transformOrder = (order) => {
  if (!order) return null;

  return {
    id: order.id,
    orderId: order.id, // Keep for backward compatibility
    restaurantId: order.restaurantId,
    userId: order.userId,
    items: order.items ? order.items.map(transformOrderItem) : [],
    deliveryAddress: order.deliveryAddress,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    createdAt: order.createdAt,
    confirmedAt: order.confirmedAt,
    deliveredAt: order.deliveredAt,
    updatedAt: order.updatedAt,
  };
};

/**
 * Transform order item subdocument to API response format
 * @param {Object} item - The raw order item object
 * @returns {Object} Transformed order item object
 */
export const transformOrderItem = (item) => {
  if (!item) return null;

  return {
    id: item.itemId,
    quantity: item.quantity,
    price: item.price,
    name: item.name,
  };
};
