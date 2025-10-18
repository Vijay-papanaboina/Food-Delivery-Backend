import { upsertOrder, getOrder } from "../repositories/orders.repo.js";
import { publishMessage, TOPICS } from "../config/kafka.js";

/**
 * Handle payment processed event
 * Updates order status to 'confirmed' and publishes order-confirmed event
 */
export async function handlePaymentProcessed(
  paymentData,
  producer,
  serviceName
) {
  const { orderId, status } = paymentData;

  const order = await getOrder(orderId);
  if (!order) {
    console.log(
      `⚠️ [${serviceName}] Order ${orderId} not found for payment update`
    );
    return;
  }

  if (status === "success") {
    order.status = "confirmed";
    order.paymentStatus = "paid";
    order.confirmedAt = new Date().toISOString();

    // Persist confirmation
    await upsertOrder(order);

    // Publish order confirmed event
    // Ensure items array is properly serialized
    const sanitizedItems = order.items.map((item) => ({
      itemId: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    // Ensure deliveryAddress is properly serialized
    const sanitizedDeliveryAddress = {
      street: order.deliveryAddress.street,
      city: order.deliveryAddress.city,
      state: order.deliveryAddress.state,
      zipCode: order.deliveryAddress.zipCode,
    };

    const orderConfirmedData = {
      orderId: order.id,
      restaurantId: order.restaurantId,
      userId: order.userId,
      items: sanitizedItems,
      total: order.total,
      confirmedAt: order.confirmedAt,
      deliveryAddress: sanitizedDeliveryAddress,
    };

    console.log(
      `🔍 [${serviceName}] Publishing ORDER_CONFIRMED with data:`,
      JSON.stringify(orderConfirmedData, null, 2)
    );
    await publishMessage(producer, TOPICS.ORDER_CONFIRMED, orderConfirmedData);

    console.log(
      `✅ [${serviceName}] Order ${orderId} confirmed after successful payment`
    );
  } else {
    order.status = "payment_failed";
    order.paymentStatus = "failed";
    console.log(`❌ [${serviceName}] Order ${orderId} payment failed`);
  }

  // Order updated in database via upsertOrder call above
}

/**
 * Handle delivery completed event
 * Updates order status to 'delivered'
 */
export async function handleDeliveryCompleted(
  deliveryData,
  producer,
  serviceName
) {
  const { orderId } = deliveryData;

  const order = await getOrder(orderId);
  if (!order) {
    console.log(
      `⚠️ [${serviceName}] Order ${orderId} not found for delivery update`
    );
    return;
  }

  order.status = "delivered";
  order.deliveredAt = new Date().toISOString();
  await upsertOrder(order);
  console.log(`✅ [${serviceName}] Order ${orderId} marked as delivered`);
}
