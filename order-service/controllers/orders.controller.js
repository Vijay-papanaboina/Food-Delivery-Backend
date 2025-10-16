import { v4 as uuidv4 } from "uuid";
import { upsertOrder, getOrder } from "../repositories/orders.repo.js";
import { listOrdersDrizzle, getOrderStatsDrizzle } from "../repositories/orders.stats.repo.js";
import { TOPICS, publishMessage } from "../config/kafka.js";

export const buildCreateOrderController = (producer, serviceName) => async (req, res) => {
  try {
    const { restaurantId, items, userId, deliveryAddress } = req.body;
    
    // Validate required fields
    if (!restaurantId || !items || !userId || !deliveryAddress) {
      return res.status(400).json({
        error: "Missing required fields: restaurantId, items, userId, deliveryAddress",
      });
    }
    
    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items must be a non-empty array" });
    }
    
    // Validate each item in the array
    for (const [index, item] of items.entries()) {
      if (!item.itemId || !item.price || !item.quantity) {
        return res.status(400).json({ 
          error: `Item at index ${index} missing required fields: itemId, price, quantity` 
        });
      }
      if (typeof item.price !== 'number' || item.price <= 0) {
        return res.status(400).json({ 
          error: `Item at index ${index} has invalid price: must be a positive number` 
        });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return res.status(400).json({ 
          error: `Item at index ${index} has invalid quantity: must be a positive integer` 
        });
      }
    }
    
    // Validate data types
    if (typeof restaurantId !== 'string' || typeof userId !== 'string') {
      return res.status(400).json({ 
        error: "restaurantId and userId must be strings" 
      });
    }
    
    // Validate deliveryAddress structure
    if (typeof deliveryAddress !== 'object' || deliveryAddress === null) {
      return res.status(400).json({ 
        error: "deliveryAddress must be an object" 
      });
    }
    
    const requiredAddressFields = ['street', 'city', 'state', 'zipCode'];
    for (const field of requiredAddressFields) {
      if (!deliveryAddress[field] || typeof deliveryAddress[field] !== 'string') {
        return res.status(400).json({ 
          error: `deliveryAddress.${field} is required and must be a string` 
        });
      }
    }

    // Validate restaurant status and menu items via restaurant-service
    const statusResp = await fetch(`http://localhost:${process.env.RESTAURANT_SERVICE_PORT || 3002}/api/restaurants/${restaurantId}/status`);
    if (!statusResp.ok) {
      return res.status(400).json({ error: "Restaurant not found" });
    }
    const statusJson = await statusResp.json();
    if (!statusJson.isOpen) {
      return res.status(400).json({ error: "Restaurant is currently closed", reason: statusJson.reason });
    }

    const validateResp = await fetch(`http://localhost:${process.env.RESTAURANT_SERVICE_PORT || 3002}/api/restaurants/${restaurantId}/menu/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });
    if (!validateResp.ok) {
      return res.status(400).json({ error: "Failed to validate menu items" });
    }
    const validateJson = await validateResp.json();
    if (!validateJson.valid) {
      return res.status(400).json({ error: "Invalid menu items", details: validateJson.errors });
    }

    const validatedItems = validateJson.items;
    const total = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = {
      orderId: uuidv4(),
      restaurantId,
      items: validatedItems,
      userId,
      deliveryAddress,
      status: "pending",
      paymentStatus: "pending",
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await upsertOrder(order);
    await publishMessage(producer, TOPICS.ORDER_CREATED, {
      orderId: order.orderId,
      restaurantId: order.restaurantId,
      items: order.items,
      userId: order.userId,
      total: order.total,
      createdAt: order.createdAt,
    }, order.orderId);

    console.log(`📤 [${serviceName}] Order created: ${order.orderId}`);
    res.status(201).json({
      message: "Order created successfully",
      order: { 
        orderId: order.orderId, 
        restaurantId: order.restaurantId,
        userId: order.userId,
        items: order.items,
        deliveryAddress: order.deliveryAddress,
        status: order.status, 
        paymentStatus: order.paymentStatus,
        total: order.total, 
        createdAt: order.createdAt 
      },
    });
  } catch (error) {
    console.error(`❌ [${serviceName}] Error creating order:`, error.message);
    res.status(500).json({ error: "Failed to create order", details: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrder(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order retrieved successfully", order });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve order", details: error.message });
  }
};

export const listOrders = async (req, res) => {
  try {
    const { status, userId, restaurantId, limit } = req.query;
    const orders = await listOrdersDrizzle({ status, userId, restaurantId, limit });
    res.json({ message: "Orders retrieved successfully", orders, total: orders.length });
  } catch (error) {
    console.error(`❌ [order-service] Error retrieving orders:`, error.message);
    res.status(500).json({ error: "Failed to retrieve orders", details: error.message });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const stats = await getOrderStatsDrizzle();
    res.json({ message: "Order statistics retrieved successfully", stats });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve order statistics", details: error.message });
  }
};


