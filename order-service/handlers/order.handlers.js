import { getOrder, updateOrderStatus } from "../repositories/orders.repo.js";
import { publishMessage, TOPICS } from "../config/kafka.js";

/**
 * Handle payment processed event
 * Updates order status to 'confirmed' and publishes order-confirmed event
 */
export async function handlePaymentProcessed(
  paymentData,
  producer,
  serviceName,
) {
  const { orderId, status } = paymentData;

  const order = await getOrder(orderId);
  if (!order) {
    console.log(
      `⚠️ [${serviceName}] Order ${orderId} not found for payment update`,
    );
    return;
  }

  if (status === "success") {
    // Use simple UPDATE instead of upsert
    await updateOrderStatus(
      orderId,
      "confirmed",
      "paid",
      new Date().toISOString(),
    );

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
      orderId: orderId, // Use the orderId from the function argument
      restaurantId: order.restaurantId,
      userId: order.userId,
      items: sanitizedItems,
      total: order.total,
      confirmedAt: order.confirmedAt,
      deliveryAddress: sanitizedDeliveryAddress,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    };

    console.log(
      `🔍 [${serviceName}] Publishing ORDER_CONFIRMED with data:`,
      JSON.stringify(orderConfirmedData, null, 2),
    );
    await publishMessage(producer, TOPICS.ORDER_CONFIRMED, orderConfirmedData);

    console.log(
      `✅ [${serviceName}] Order ${orderId} confirmed after successful payment`,
    );
  } else {
    // Use simple UPDATE for payment failure too
    await updateOrderStatus(orderId, "payment_failed", "failed");
    console.log(`❌ [${serviceName}] Order ${orderId} payment failed`);
  }
}

/**
 * Handle delivery completed event
 * Updates order status to 'delivered'
 */
export async function handleDeliveryCompleted(
  deliveryData,
  producer,
  serviceName,
) {
  const { orderId } = deliveryData;

  if (!orderId) {
    console.log(
      `❌ [${serviceName}] No orderId in delivery completed event:`,
      deliveryData,
    );
    return;
  }

  const order = await getOrder(orderId);
  if (!order) {
    console.log(
      `⚠️ [${serviceName}] Order ${orderId} not found for delivery update`,
    );
    return;
  }

  if (order.status === "delivered") {
    return;
  }

  // Use simple UPDATE instead of upsert
  await updateOrderStatus(
    orderId,
    "delivered",
    null,
    null,
    new Date().toISOString(),
  );
  console.log(`✅ [${serviceName}] Order ${orderId} marked as delivered`);
}

/**
 * Handle food ready event
 * Updates order status to 'ready' and enriches with customer info
 */
export async function handleFoodReady(foodData, producer, serviceName) {
  const { orderId } = foodData;

  const order = await getOrder(orderId);
  if (!order) {
    console.log(
      `⚠️ [${serviceName}] Order ${orderId} not found for food ready update`,
    );
    return;
  }

  // Use simple UPDATE instead of upsert
  await updateOrderStatus(orderId, "ready");
  console.log(
    `✅ [${serviceName}] Order ${orderId} marked as ready for pickup`,
  );
}

/**
 * Handle delivery picked up event
 * Updates order status to 'out_for_delivery'
 */
export async function handleDeliveryPickedUp(
  deliveryData,
  producer,
  serviceName,
) {
  const { orderId } = deliveryData;

  const order = await getOrder(orderId);
  if (!order) {
    console.log(
      `⚠️ [${serviceName}] Order ${orderId} not found for delivery pickup update`,
    );
    return;
  }

  // Use simple UPDATE instead of upsert
  await updateOrderStatus(orderId, "out_for_delivery");
  console.log(
    `✅ [${serviceName}] Order ${orderId} marked as out for delivery`,
  );
}
