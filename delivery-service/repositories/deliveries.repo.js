import { Delivery, Driver } from "../db/schema.js";

export async function createDelivery(deliveryData) {
  const delivery = new Delivery({
    orderId: deliveryData.orderId,
    driverId: deliveryData.driverId,
    driverName: deliveryData.driverName || "Unknown Driver",
    driverPhone: deliveryData.driverPhone || "Unknown Phone",
    vehicle: deliveryData.vehicle || "Unknown Vehicle",
    licensePlate: deliveryData.licensePlate || "Unknown Plate",
    deliveryAddress: deliveryData.deliveryAddress,
    status: deliveryData.status || "assigned",
    assignedAt: deliveryData.assignedAt
      ? new Date(deliveryData.assignedAt)
      : new Date(),
    estimatedDeliveryTime: deliveryData.estimatedDeliveryTime
      ? new Date(deliveryData.estimatedDeliveryTime)
      : null,
    actualDeliveryTime: deliveryData.actualDeliveryTime
      ? new Date(deliveryData.actualDeliveryTime)
      : null,
    // Gig-worker fields
    deliveryFee: deliveryData.deliveryFee || 3.5,
    acceptanceStatus: deliveryData.acceptanceStatus || "pending",
    declinedByDrivers: deliveryData.declinedByDrivers || [],
    // Restaurant info
    restaurantId: deliveryData.restaurantId,
    restaurantName: deliveryData.restaurantName,
    restaurantAddress: deliveryData.restaurantAddress,
    restaurantPhone: deliveryData.restaurantPhone,
    // Customer info
    customerName: deliveryData.customerName,
    customerPhone: deliveryData.customerPhone,
    // Order info
    orderItems: deliveryData.orderItems,
    orderTotal: deliveryData.orderTotal,
  });

  const savedDelivery = await delivery.save();
  return savedDelivery.toObject();
}

export async function upsertDelivery(d) {
  const filter = d.id ? { _id: d.id } : { orderId: d.orderId };
  const update = {
    orderId: d.orderId,
    driverId: d.driverId,
    driverName: d.driverName,
    driverPhone: d.driverPhone,
    vehicle: d.vehicle,
    licensePlate: d.licensePlate,
    deliveryAddress: d.deliveryAddress,
    status: d.status,
    assignedAt: d.assignedAt ? new Date(d.assignedAt) : undefined,
    estimatedDeliveryTime: d.estimatedDeliveryTime
      ? new Date(d.estimatedDeliveryTime)
      : undefined,
    actualDeliveryTime: d.actualDeliveryTime
      ? new Date(d.actualDeliveryTime)
      : undefined,
    // Gig-worker fields
    deliveryFee: d.deliveryFee,
    acceptanceStatus: d.acceptanceStatus,
    declinedByDrivers: d.declinedByDrivers,
    // Restaurant info
    restaurantId: d.restaurantId,
    restaurantName: d.restaurantName,
    restaurantAddress: d.restaurantAddress,
    restaurantPhone: d.restaurantPhone,
    // Customer info
    customerName: d.customerName,
    customerPhone: d.customerPhone,
    // Order info
    orderItems: d.orderItems,
    orderTotal: d.orderTotal,
  };

  // Remove undefined fields
  Object.keys(update).forEach(
    (key) => update[key] === undefined && delete update[key]
  );

  const result = await Delivery.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });

  return result.toObject();
}

export async function updateDeliveryFields(deliveryId, fields) {
  const update = {};
  if (fields.status !== undefined) update.status = fields.status;
  if (fields.assignedAt !== undefined)
    update.assignedAt = fields.assignedAt ? new Date(fields.assignedAt) : null;
  if (fields.pickedUpAt !== undefined)
    update.pickedUpAt = fields.pickedUpAt ? new Date(fields.pickedUpAt) : null;
  if (fields.estimatedDeliveryTime !== undefined)
    update.estimatedDeliveryTime = fields.estimatedDeliveryTime
      ? new Date(fields.estimatedDeliveryTime)
      : null;
  if (fields.actualDeliveryTime !== undefined)
    update.actualDeliveryTime = fields.actualDeliveryTime
      ? new Date(fields.actualDeliveryTime)
      : null;
  if (fields.acceptanceStatus !== undefined)
    update.acceptanceStatus = fields.acceptanceStatus;

  if (Object.keys(update).length === 0) return;

  await Delivery.findByIdAndUpdate(deliveryId, update);
}

export async function getDelivery(deliveryId) {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) return null;
  return delivery.toObject();
}

export async function getDeliveryByOrderId(orderId) {
  const delivery = await Delivery.findOne({ orderId });
  if (!delivery) return null;
  return delivery.toObject();
}

export async function getDeliveries(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.driverId) query.driverId = filters.driverId;

  let q = Delivery.find(query).sort({ createdAt: -1 });
  if (filters.limit) {
    q = q.limit(Number(filters.limit));
  }

  const deliveries = await q;
  return deliveries.map((d) => d.toObject());
}

export async function getDeliveryStats() {
  const [
    totalDeliveries,
    inProgressDeliveries,
    completedDeliveries,
    pendingDeliveries,
    totalDrivers,
    availableDrivers,
    completedWithTimes,
  ] = await Promise.all([
    Delivery.countDocuments(),
    Delivery.countDocuments({ status: "assigned" }),
    Delivery.countDocuments({ status: "completed" }),
    Delivery.countDocuments({ status: "pending_assignment" }),
    Driver.countDocuments(),
    Driver.countDocuments({ isAvailable: true }),
    Delivery.find({
      status: "completed",
      assignedAt: { $exists: true },
      actualDeliveryTime: { $exists: true },
    }).select("assignedAt actualDeliveryTime"),
  ]);

  let averageDeliveryTimeMinutes = 0;
  if (completedWithTimes.length > 0) {
    const minutes = completedWithTimes.map(
      (r) =>
        (new Date(r.actualDeliveryTime).getTime() -
          new Date(r.assignedAt).getTime()) /
        60000
    );
    if (minutes.length > 0) {
      averageDeliveryTimeMinutes =
        minutes.reduce((a, b) => a + b, 0) / minutes.length;
    }
  }

  return {
    totalDeliveries,
    inProgressDeliveries,
    completedDeliveries,
    pendingDeliveries,
    totalDrivers,
    availableDrivers,
    averageDeliveryTimeMinutes: Number(averageDeliveryTimeMinutes.toFixed(2)),
  };
}

export async function getDriverStats(driverId) {
  try {
    const totalDeliveries = await Delivery.countDocuments({ driverId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedToday = await Delivery.countDocuments({
      driverId,
      status: "completed",
      actualDeliveryTime: { $gte: today, $lt: tomorrow },
    });

    const earningsPerDelivery = 5.0;
    const todayEarnings = (completedToday * earningsPerDelivery).toFixed(2);

    return {
      totalDeliveries,
      completedToday,
      averageRating: "4.5", // Default rating for now
      earnings: todayEarnings,
    };
  } catch (error) {
    console.error("Error getting driver stats:", error);
    return {
      totalDeliveries: 0,
      completedToday: 0,
      averageRating: "0.0",
      earnings: "0.00",
    };
  }
}

export async function acceptDelivery(deliveryId, driverId) {
  const result = await Delivery.findOneAndUpdate(
    { _id: deliveryId, driverId },
    { acceptanceStatus: "accepted" },
    { new: true }
  );
  return result ? result.toObject() : null;
}

export async function declineDelivery(deliveryId, driverId) {
  const result = await Delivery.findOneAndUpdate(
    { _id: deliveryId, driverId },
    {
      acceptanceStatus: "declined",
      $push: { declinedByDrivers: driverId },
    },
    { new: true }
  );
  return result ? result.toObject() : null;
}

export async function getDeliveryWithFullDetails(deliveryId) {
  return getDelivery(deliveryId); // In Mongoose, we store everything in one doc, so this is same as getDelivery
}

export async function findAvailableDriverForReassignment(
  excludeDriverIds = []
) {
  const query = { isAvailable: true };
  if (excludeDriverIds.length > 0) {
    query._id = { $nin: excludeDriverIds };
  }
  const driver = await Driver.findOne(query);
  return driver ? driver.toObject() : null;
}

export async function enrichDeliveryWithOrderDetails(deliveryId, orderData) {
  const update = {
    restaurantId: orderData.restaurantId,
    restaurantName: orderData.restaurantName,
    restaurantAddress: orderData.restaurantAddress,
    restaurantPhone: orderData.restaurantPhone,
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    orderItems: orderData.orderItems,
    orderTotal: orderData.orderTotal,
    deliveryFee: orderData.deliveryFee || 3.5,
  };

  const result = await Delivery.findByIdAndUpdate(deliveryId, update, {
    new: true,
  });
  return result ? result.toObject() : null;
}
