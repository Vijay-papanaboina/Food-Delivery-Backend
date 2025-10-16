import { upsertRestaurant, upsertMenuItem, upsertKitchenOrder, getKitchenOrder } from "../config/db.js";
import { publishMessage, TOPICS } from "../config/kafka.js";

// Preparation configuration
const PREPARATION_CONFIG = {
  minTime: 20000, // 20 seconds in milliseconds
  maxTime: 30000, // 30 seconds in milliseconds
};

/**
 * Handle order confirmed event
 * Starts food preparation process with simulation delay
 */
export async function handleOrderConfirmed(orderData, producer, serviceName) {
  const { orderId, restaurantId, userId, items, total, deliveryAddress } = orderData;

  console.log(
    `🍳 [${serviceName}] Starting food preparation for order ${orderId}`
  );

  // Create and persist kitchen order record
  const kitchenOrder = {
    orderId,
    restaurantId,
    userId,
    items,
    total,
    deliveryAddress, // Store delivery address
    status: "received",
    receivedAt: new Date().toISOString(),
    startedAt: null,
    estimatedReadyTime: null,
    readyAt: null,
    preparationTime: null,
  };
  
  await upsertKitchenOrder(kitchenOrder);

  // Start preparation process
  await startFoodPreparation(orderId, producer, serviceName);
}

/**
 * Start food preparation with simulation delay
 */
async function startFoodPreparation(orderId, producer, serviceName) {
  const order = await getKitchenOrder(orderId);
  if (!order) {
    console.log(`⚠️ [${serviceName}] Kitchen order ${orderId} not found`);
    return;
  }

  // Update status to preparing
  order.status = "preparing";
  order.startedAt = new Date().toISOString();

  // Calculate random preparation time (20-30 seconds)
  const preparationTime =
    PREPARATION_CONFIG.minTime +
    Math.random() * (PREPARATION_CONFIG.maxTime - PREPARATION_CONFIG.minTime);

  order.estimatedReadyTime = new Date(
    Date.now() + preparationTime
  ).toISOString();
  order.preparationTime = Math.round(preparationTime / 1000); // Store in seconds
  
  // Update in database
  await upsertKitchenOrder(order);

  console.log(
    `🍳 [${serviceName}] Preparing order ${orderId} (estimated ${order.preparationTime}s)`
  );

  // Simulate preparation delay
  await new Promise((resolve) => setTimeout(resolve, preparationTime));

  // Mark as ready
  await markOrderReady(orderId, producer, serviceName);
}

/**
 * Mark order as ready and publish food-ready event
 */
async function markOrderReady(orderId, producer, serviceName) {
  const order = await getKitchenOrder(orderId);
  if (!order) {
    console.log(`⚠️ [${serviceName}] Kitchen order ${orderId} not found`);
    return;
  }

  if (order.status === "ready") {
    console.log(
      `⚠️ [${serviceName}] Order ${orderId} already marked as ready`
    );
    return;
  }

  // Update status to ready
  order.status = "ready";
  order.readyAt = new Date().toISOString();
  
  // Update in database
  await upsertKitchenOrder(order);

  console.log(`✅ [${serviceName}] Order ${orderId} is ready for delivery!`);

  // Publish food-ready event
  await publishMessage(
    producer,
    TOPICS.FOOD_READY,
    {
      orderId: order.orderId,
      restaurantId: order.restaurantId,
      userId: order.userId,
      items: order.items,
      total: order.total,
      readyAt: order.readyAt,
      preparationTime: order.preparationTime,
      deliveryAddress: order.deliveryAddress, // Add delivery address
    },
    orderId
  );

  console.log(
    `📤 [${serviceName}] Published food-ready event for order ${orderId}`
  );
}

/**
 * Initialize sample restaurant and menu data
 */
export async function initializeSampleRestaurants() {
  const sampleRestaurants = [
    {
      restaurantId: "rest-001",
      name: "Mario's Pizza Palace",
      cuisine: "Italian",
      address: "123 Main St, Downtown",
      phone: "+1-555-0123",
      rating: 4.5,
      deliveryTime: "25-35 min",
      deliveryFee: 2.99,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      restaurantId: "rest-002",
      name: "Burger Junction",
      cuisine: "American",
      address: "456 Oak Ave, Midtown",
      phone: "+1-555-0456",
      rating: 4.2,
      deliveryTime: "20-30 min",
      deliveryFee: 1.99,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      restaurantId: "rest-003",
      name: "Thai Garden",
      cuisine: "Thai",
      address: "789 Pine St, Uptown",
      phone: "+1-555-0789",
      rating: 4.7,
      deliveryTime: "30-40 min",
      deliveryFee: 3.99,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Sample menu items
  const sampleMenus = [
    // Mario's Pizza Palace menu
    {
      itemId: "item-001",
      restaurantId: "rest-001",
      name: "Margherita Pizza",
      description: "Fresh mozzarella, tomato sauce, and basil",
      price: 12.99,
      category: "pizza",
      isAvailable: true,
      preparationTime: 15,
      createdAt: new Date(),
    },
    {
      itemId: "item-002",
      restaurantId: "rest-001",
      name: "Pepperoni Pizza",
      description: "Classic pepperoni with mozzarella and tomato sauce",
      price: 14.99,
      category: "pizza",
      isAvailable: true,
      preparationTime: 15,
      createdAt: new Date(),
    },
    {
      itemId: "item-003",
      restaurantId: "rest-001",
      name: "Caesar Salad",
      description: "Fresh romaine lettuce, croutons, parmesan cheese",
      price: 8.99,
      category: "salad",
      isAvailable: true,
      preparationTime: 10,
      createdAt: new Date(),
    },
    // Burger Junction menu
    {
      itemId: "item-004",
      restaurantId: "rest-002",
      name: "Classic Burger",
      description: "Beef patty, lettuce, tomato, onion, special sauce",
      price: 9.99,
      category: "burger",
      isAvailable: true,
      preparationTime: 12,
      createdAt: new Date(),
    },
    {
      itemId: "item-005",
      restaurantId: "rest-002",
      name: "Bacon Cheeseburger",
      description: "Beef patty, bacon, cheese, lettuce, tomato",
      price: 11.99,
      category: "burger",
      isAvailable: true,
      preparationTime: 15,
      createdAt: new Date(),
    },
    {
      itemId: "item-006",
      restaurantId: "rest-002",
      name: "French Fries",
      description: "Crispy golden fries with sea salt",
      price: 4.99,
      category: "sides",
      isAvailable: true,
      preparationTime: 8,
      createdAt: new Date(),
    },
    // Thai Garden menu
    {
      itemId: "item-007",
      restaurantId: "rest-003",
      name: "Pad Thai",
      description: "Stir-fried rice noodles with shrimp, tofu, and peanuts",
      price: 13.99,
      category: "noodles",
      isAvailable: true,
      preparationTime: 20,
      createdAt: new Date(),
    },
    {
      itemId: "item-008",
      restaurantId: "rest-003",
      name: "Green Curry",
      description: "Spicy green curry with chicken and vegetables",
      price: 14.99,
      category: "curry",
      isAvailable: true,
      preparationTime: 18,
      createdAt: new Date(),
    },
    {
      itemId: "item-009",
      restaurantId: "rest-003",
      name: "Spring Rolls",
      description: "Fresh vegetables wrapped in rice paper",
      price: 6.99,
      category: "appetizer",
      isAvailable: true,
      preparationTime: 10,
      createdAt: new Date(),
    },
  ];

  // Store restaurants in database
  for (const restaurant of sampleRestaurants) {
    await upsertRestaurant(restaurant);
  }

  // Store menu items in database
  for (const menuItem of sampleMenus) {
    await upsertMenuItem(menuItem);
  }

  console.log(
    `🍽️ [restaurant-service] Initialized ${sampleRestaurants.length} restaurants and ${sampleMenus.length} menu items`
  );
}
