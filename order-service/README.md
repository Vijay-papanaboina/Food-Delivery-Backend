# Order Service

Order management microservice for the Food Delivery platform. Handles order creation, status updates, and orchestrates the order workflow.

## 🛠️ Tech Stack

### Core
*   **Runtime:** Node.js 20.x
*   **Framework:** Express.js 5.1.0
*   **Language:** JavaScript (ES Modules)

### Database
*   **Database:** MongoDB (via Mongoose 8.20.0)
*   **ODM:** Mongoose with schema validation

### Message Broker
*   **Kafka:** KafkaJS 2.2.4 for event-driven communication
*   **Producer Topics:** `order-created`, `order-confirmed`
*   **Consumer Topics:** `payment-processed`, `delivery-completed`

### Security & Middleware
*   **JWT:** jsonwebtoken 9.0.2 (token verification)
*   **CORS:** cors 2.8.5
*   **Logging:** Winston 3.18.3 + Morgan 1.10.1

## ✨ Features

*   **Order Management:** Create new orders with cart items
*   **Order Retrieval:** Get order details by ID or list all orders
*   **Status Tracking:** Track order status through the entire lifecycle
*   **Order Statistics:** View order analytics and metrics
*   **Kafka Integration:**
    - Publish `order-created` events (triggers payment processing)
    - Publish `order-confirmed` events (after payment, triggers kitchen)
    - Consume `payment-processed` events (updates order status)
    - Consume `delivery-completed` events (marks order as delivered)
*   **Restaurant Integration:** Fetch menu items and restaurant details
*   **User Association:** Orders linked to customers and restaurants
*   **Health Checks:** Kubernetes-ready health endpoint

## 📋 Prerequisites

*   **Node.js:** 20.x or higher
*   **MongoDB:** 5.0 or higher (running instance)
*   **Kafka:** Running Kafka broker (localhost:9092 or configured cluster)
*   **npm:** 9.x or higher
*   **Restaurant Service:** For menu item validation

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd order-service
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `order-service` directory:

```env
# Server Configuration
PORT=5001
SERVICE_NAME=order-service
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/food-delivery
DATABASE_URL=mongodb://localhost:27017/food-delivery

# JWT Configuration (for verifying tokens)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Service URLs
RESTAURANT_SERVICE_URL=http://localhost:5006

# Kafka Configuration
KAFKA_CLIENT_ID=order-service
KAFKA_BROKERS=localhost:9092

# Kafka Topics
TOPIC_ORDER_CREATED=order-created
TOPIC_PAYMENT_PROCESSED=payment-processed
TOPIC_ORDER_CONFIRMED=order-confirmed
TOPIC_FOOD_READY=food-ready
TOPIC_DELIVERY_ASSIGNED=delivery-assigned
TOPIC_DELIVERY_PICKED_UP=delivery-picked-up
TOPIC_DELIVERY_COMPLETED=delivery-completed

# Frontend URLs (comma-separated for CORS)
FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

**Environment Variable Details:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5001` | Port number for the service |
| `SERVICE_NAME` | No | `order-service` | Service identifier for logging |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `DATABASE_URL` | No | - | Alternative MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | Secret key for verifying JWT tokens (must match user-service) |
| `RESTAURANT_SERVICE_URL` | No | `http://localhost:5006` | Restaurant service endpoint for menu validation |
| `KAFKA_CLIENT_ID` | No | `order-service` | Kafka client identifier |
| `KAFKA_BROKERS` | No | `localhost:9092` | Comma-separated list of Kafka brokers |
| `TOPIC_ORDER_CREATED` | No | `order-created` | Topic to publish new order events |
| `TOPIC_PAYMENT_PROCESSED` | No | `payment-processed` | Topic to consume payment events |
| `TOPIC_ORDER_CONFIRMED` | No | `order-confirmed` | Topic to publish confirmed order events |
| `TOPIC_FOOD_READY` | No | `food-ready` | Topic for food ready events |
| `TOPIC_DELIVERY_ASSIGNED` | No | `delivery-assigned` | Topic for delivery assignment events |
| `TOPIC_DELIVERY_PICKED_UP` | No | `delivery-picked-up` | Topic for pickup events |
| `TOPIC_DELIVERY_COMPLETED` | No | `delivery-completed` | Topic to consume delivery completion events |
| `FRONTEND_URL` | No | (see defaults) | Comma-separated list of allowed frontend origins |

### 3. Seed Database (Optional)

From the backend root directory, run the MongoDB seed script:

```bash
cd ..
node seed-mongodb.mjs
```

### 4. Start Dependencies

**Start Kafka:**
```bash
docker-compose up -d kafka zookeeper
```

**Start Restaurant Service:**
```bash
cd ../restaurant-service
npm run dev
```

### 5. Run Development Server

```bash
npm run dev
```

The service will start at **`http://localhost:5001`**

### 6. Run Production Server

```bash
npm start
```

## 📡 API Endpoints

### Order Management

```
POST   /api/orders                - Create new order (auth required)
GET    /api/orders/:id            - Get order by ID (auth required)
GET    /api/orders                - List all orders (auth required)
GET    /api/orders/customer/:id   - Get orders by customer ID
GET    /api/orders/restaurant/:id - Get orders by restaurant ID
GET    /api/orders/stats          - Get order statistics
```

### Health Check

```
GET    /health                    - Health check endpoint
```

## 🎯 Kafka Event Flow

### Published Events

**Topic:** `order-created`
```json
{
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "customerId": "65f2d6c0c0c0c0c0c0c0c010",
  "restaurantId": "65f2d6c0c0c0c0c0c0c0c001",
  "items": [
    {
      "menuItemId": "65f2d6c1c0c0c0c0c0c0c101",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 12.99
    }
  ],
  "subtotal": 25.98,
  "deliveryFee": 2.99,
  "totalAmount": 28.97,
  "deliveryAddress": {...},
  "status": "PENDING_PAYMENT",
  "timestamp": "2024-03-15T14:00:00Z"
}
```

**Topic:** `order-confirmed` (after payment)
```json
{
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "customerId": "65f2d6c0c0c0c0c0c0c0c010",
  "restaurantId": "65f2d6c0c0c0c0c0c0c0c001",
  "items": [...],
  "totalAmount": 28.97,
  "deliveryAddress": {...},
  "status": "CONFIRMED",
  "timestamp": "2024-03-15T14:05:00Z"
}
```

### Consumed Events

**Topic:** `payment-processed`
```json
{
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "customerId": "65f2d6c0c0c0c0c0c0c0c010",
  "paymentId": "65f2d6c0c0c0c0c0c0c0d001",
  "amount": 28.97,
  "status": "SUCCESS",
  "paymentMethod": "card",
  "timestamp": "2024-03-15T14:05:00Z"
}
```

**Topic:** `delivery-completed`
```json
{
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "deliveryId": "65f2d6c0c0c0c0c0c0c0f001",
  "driverId": "65f2d6c0c0c0c0c0c0c0c200",
  "completedAt": "2024-03-15T15:00:00Z",
  "timestamp": "2024-03-15T15:00:00Z"
}
```

## 📊 Order Status Lifecycle

```
1. PENDING_PAYMENT   → Order created, awaiting payment
2. CONFIRMED         → Payment successful, sent to kitchen
3. PREPARING         → Kitchen accepted order (from restaurant-service)
4. READY             → Food ready for pickup (from restaurant-service)
5. OUT_FOR_DELIVERY  → Driver assigned and picked up
6. DELIVERED         → Order delivered to customer
7. CANCELLED         → Order cancelled (if payment fails or user cancels)
```

## 🏗️ Project Structure

```
order-service/
├── config/
│   ├── db.js                  # MongoDB connection
│   └── kafka.js               # Kafka configuration
├── controllers/
│   └── order.controller.js    # Order CRUD operations
├── middleware/
│   └── auth.js                # JWT verification
├── repositories/
│   ├── order.repository.js    # Order DB operations
│   └── orderCounter.repository.js # Order numbering
├── routes/
│   ├── order.routes.js        # Order endpoints
│   └── index.routes.js        # Route aggregation
├── services/
│   └── order.service.js       # Business logic & restaurant validation
├── handlers/
│   └── order.handlers.js      # Kafka message handlers
├── utils/
│   ├── kafka.utils.js         # Kafka helper functions
│   ├── logger.js              # Winston logger
│   └── orderHelpers.js        # Order utility functions
├── app.js                     # Express app configuration
├── server.js                  # Server entry point with Kafka init
├── package.json
└── Dockerfile
```

## 🐳 Docker Deployment

Build the Docker image:

```bash
docker build -t order-service .
```

Run the container:

```bash
docker run -p 5001:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/food-delivery \
  -e JWT_SECRET=your-secret \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  -e RESTAURANT_SERVICE_URL=http://host.docker.internal:5006 \
  order-service
```

**Note:** The Dockerfile exposes port 3000, so map it to 5001 on the host.

## 🔒 Security Features

*   **JWT Verification:** All authenticated endpoints verify tokens
*   **User Authorization:** Users can only view their own orders
*   **CORS:** Configurable origin whitelist
*   **Input Validation:** Mongoose schema validation

## 📝 Available Scripts

*   `npm start` - Start production server
*   `npm run dev` - Start development server with nodemon

## 🔧 Troubleshooting

**MongoDB connection error:**
*   Ensure MongoDB is running
*   Check `MONGODB_URI` in `.env`
*   Verify database name matches other services

**Kafka connection error:**
*   Ensure Kafka broker is running: `docker-compose ps`
*   Verify `KAFKA_BROKERS` is correct
*   Check logs for connection errors

**Order creation fails:**
*   Verify restaurant service is running at `RESTAURANT_SERVICE_URL`
*   Check that menu items exist in restaurant service
*   Ensure JWT token is valid
*   Verify customer has delivery address

**Payment not triggering order confirmation:**
*   Check payment-service is publishing to `payment-processed` topic
*   Verify topic names match across services
*   Look for Kafka consumer errors in logs

**Order status not updating:**
*   Verify Kafka consumers are connected
*   Check that events are being published by other services
*   Ensure `orderId` in events matches database records

## 🔗 Dependencies on Other Services

*   **MongoDB:** Required for data persistence
*   **Kafka:** Required for event-driven communication
*   **User Service:** JWT token verification (shared secret)
*   **Restaurant Service:** Menu item validation and restaurant details
*   **Payment Service:** Receives `order-created` events
*   **Delivery Service:** Sends `delivery-completed` events

## 💡 Example Order Flow

```
1. Customer places order via frontend
   ↓
2. Order Service creates order (status: PENDING_PAYMENT)
   ↓
3. Publishes "order-created" event to Kafka
   ↓
4. Payment Service consumes event → processes payment
   ↓
5. Payment Service publishes "payment-processed" event
   ↓
6. Order Service consumes event → updates status to CONFIRMED
   ↓
7. Publishes "order-confirmed" event to Kafka
   ↓
8. Restaurant Service consumes event → creates kitchen order
   ↓
9. Restaurant marks as ready → publishes "food-ready"
   ↓
10. Delivery Service assigns driver → publishes "delivery-assigned"
    ↓
11. Driver delivers → publishes "delivery-completed"
    ↓
12. Order Service consumes event → updates status to DELIVERED
```
