import { KitchenOrder } from "../db/schema.js";

export async function upsertKitchenOrder(orderData) {
  // Check if order exists by orderId (from order-service)
  const existing = await KitchenOrder.findOne({ orderId: orderData.orderId });
  
  if (existing) {
    // Update
    if (orderData.status) existing.status = orderData.status;
    if (orderData.startedAt) existing.startedAt = new Date(orderData.startedAt);
    if (orderData.estimatedReadyTime) existing.estimatedReadyTime = new Date(orderData.estimatedReadyTime);
    if (orderData.readyAt) existing.readyAt = new Date(orderData.readyAt);
    if (orderData.preparationTime) existing.preparationTime = orderData.preparationTime;
    
    await existing.save();
    return existing.toObject();
  }

  // Create new
  const newOrder = new KitchenOrder(orderData);
  await newOrder.save();
  return newOrder.toObject();
}

export async function updateKitchenOrderStatus(
  id,
  status,
  readyAt = null,
  startedAt = null,
  estimatedReadyTime = null,
  preparationTime = null
) {
  const updateData = { status };
  if (readyAt) updateData.readyAt = new Date(readyAt);
  if (startedAt) updateData.startedAt = new Date(startedAt);
  if (estimatedReadyTime) updateData.estimatedReadyTime = new Date(estimatedReadyTime);
  if (preparationTime !== null) updateData.preparationTime = preparationTime;

  let result = await KitchenOrder.findByIdAndUpdate(id, updateData);
  if (!result) {
    await KitchenOrder.findOneAndUpdate({ orderId: id }, updateData);
  }
}

export async function getKitchenOrder(id) {
  let order = await KitchenOrder.findById(id);
  if (!order) {
    order = await KitchenOrder.findOne({ orderId: id });
  }
  return order ? order.toObject() : null;
}

export async function getKitchenOrders(filters = {}) {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.restaurantId) {
    query.restaurantId = filters.restaurantId;
  }

  let dbQuery = KitchenOrder.find(query).sort({ receivedAt: -1 });

  if (filters.limit) {
    dbQuery = dbQuery.limit(Number(filters.limit));
  }

  const orders = await dbQuery;
  return orders.map(order => order.toObject());
}
