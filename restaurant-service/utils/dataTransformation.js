export function transformKitchenOrder(order) {
  return {
    id: order.id,

    // frontend expects: orderId
    orderId: order.orderId?.toString(),

    restaurantId: order.restaurantId?.toString(),
    userId: order.userId?.toString(),

    // keep arrays and objects unchanged
    items: order.items || [],

    deliveryAddress: order.deliveryAddress,
    customerName: order.customerName,
    customerPhone: order.customerPhone,

    total: order.total,
    status: order.status,

    // timestamps transformed to camelCase
    receivedAt: order.receivedAt,
    startedAt: order.startedAt,
    estimatedReadyTime: order.estimatedReadyTime,
    readyAt: order.readyAt,
    preparationTime: order.preparationTime,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function transformRestaurant(restaurant) {
  if (!restaurant) return null;
  const r = restaurant.toObject ? restaurant.toObject() : restaurant;
  return {
    ...r,
    id: r.id,
    ownerId: r.ownerId?.toString(),
  };
}

export function transformMenuItem(item) {
  if (!item) return null;
  const i = item.toObject ? item.toObject({ virtuals: true }) : item;
  
  // Ensure ID is available
  const id = i.id || (i._id ? i._id.toString() : null);

  return {
    ...i,
    id: id,
    restaurantId: i.restaurantId?.toString(),
  };
}