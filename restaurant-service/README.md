# Restaurant Service

Restaurant management microservice for the Food Delivery platform. Handles restaurant information, menu management, and kitchen order operations.

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
*   **Producer Topics:** `food-ready`
*   **Consumer Topics:** `order-confirmed`

### Security & Middleware
*   **JWT:** jsonwebtoken 9.0.2 (token verification)
*   **CORS:** cors 2.8.5
*   **Logging:** Winston 3.18.3 + Morgan 1.10.1

## ✨ Features

*   **Restaurant Management:** Create, read, update restaurant information
*   **Menu Management:** Full CRUD operations for menu items with categories
*   **Item Availability:** Toggle individual menu item availability
*   **Restaurant Status:** Open/close restaurant to accept orders
*   **Kitchen Orders:** Real-time view of incoming orders
*   **Order Processing:** Accept orders and mark them as ready for delivery
*   **Kafka Integration:** 
    - Consume `order-confirmed` events from order service
    - Publish `food-ready` events to trigger delivery assignment
*   **Role-Based Access:** Restaurant owners can only manage their own restaurants
*   **Health Checks:** Kubernetes-ready health endpoint

## 📋 Prerequisites

*   **Node.js:** 20.x or higher
*   **MongoDB:** 5.0 or higher (running instance)
*   **Kafka:** Running Kafka broker (localhost:9092 or configured cluster)
*   **npm:** 9.x or higher

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd restaurant-service
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `restaurant-service` directory:

```env
# Server Configuration
PORT=5006
SERVICE_NAME=restaurant-service
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/food-delivery
DATABASE_URL=mongodb://localhost:27017/food-delivery

# JWT Configuration (for verifying tokens from user-service)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Kafka Configuration
KAFKA_CLIENT_ID=restaurant-service
KAFKA_BROKERS=localhost:9092

# Kafka Topics
TOPIC_ORDER_CONFIRMED=order-confirmed
TOPIC_FOOD_READY=food-ready
TOPIC_DELIVERY_PICKED_UP=delivery-picked-up
TOPIC_DELIVERY_COMPLETED=delivery-completed

# Frontend URLs (comma-separated for CORS)
FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

**Environment Variable Details:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5006` | Port number for the service |
| `SERVICE_NAME` | No | `restaurant-service` | Service identifier for logging |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `DATABASE_URL` | No | - | Alternative MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | Secret key for verifying JWT tokens (must match user-service) |
| `KAFKA_CLIENT_ID` | No | `restaurant-service` | Kafka client identifier |
| `KAFKA_BROKERS` | No | `localhost:9092` | Comma-separated list of Kafka brokers |
| `TOPIC_ORDER_CONFIRMED` | No | `order-confirmed` | Topic to consume order confirmations |
| `TOPIC_FOOD_READY` | No | `food-ready` | Topic to publish food ready events |
| `TOPIC_DELIVERY_PICKED_UP` | No | `delivery-picked-up` | Topic for delivery pickup events |
| `TOPIC_DELIVERY_COMPLETED` | No | `delivery-completed` | Topic for delivery completion events |
| `FRONTEND_URL` | No | (see defaults) | Comma-separated list of allowed frontend origins |

### 3. Seed Database (Optional)

From the backend root directory, run the MongoDB seed script:

```bash
# Make sure MongoDB is running
cd ..
node seed-mongodb.mjs
```

This will populate restaurants, menu items, and link them to restaurant owners.

### 4. Start Kafka (Required)

Make sure Kafka is running. If using Docker:

```bash
# From project root
docker-compose up -d kafka zookeeper
```

### 5. Run Development Server

```bash
npm run dev
```

The service will start at **`http://localhost:5006`** and automatically:
- Connect to MongoDB
- Connect to Kafka broker
- Subscribe to `order-confirmed` topic

### 6. Run Production Server

```bash
npm start
```

## 📡 API Endpoints

### Restaurant Information

```
GET    /api/restaurants              - List all restaurants
GET    /api/restaurants/:id          - Get restaurant by ID
GET    /api/restaurants/owner/:id    - Get restaurant by owner ID
PUT    /api/restaurants/:id          - Update restaurant info (auth required)
PATCH  /api/restaurants/:id/status   - Update restaurant open/closed status (auth required)
```

### Menu Management

```
GET    /api/restaurants/:id/menu            - Get restaurant menu
GET    /api/menu/:itemId                    - Get menu item by ID
POST   /api/restaurants/:id/menu            - Add menu item (auth required)
PUT    /api/menu/:itemId                    - Update menu item (auth required)
DELETE /api/menu/:itemId                    - Delete menu item (auth required)
PATCH  /api/menu/:itemId/availability       - Toggle item availability (auth required)
```

### Kitchen Orders

```
GET    /api/kitchen/orders                  - List all kitchen orders for restaurant (auth required)
GET    /api/kitchen/orders/:orderId         - Get kitchen order details (auth required)
POST   /api/kitchen/orders/:orderId/accept  - Accept incoming order (auth required)
POST   /api/kitchen/orders/:orderId/ready   - Mark order as ready (auth required)
```

### Health Check

```
GET    /health                              - Health check endpoint
```

## 🎯 Kafka Event Flow

### Published Events

**Topic:** `food-ready`

```json
{
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "restaurantId": "65f2d6c0c0c0c0c0c0c0c001",
  "estimatedPickupTime": "2024-03-15T14:30:00Z",
  "items": [...],
  "timestamp": "2024-03-15T14:15:00Z"
}
```

### Consumed Events

**Topic:** `order-confirmed`

```json
{
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "customerId": "65f2d6c0c0c0c0c0c0c0c010",
  "restaurantId": "65f2d6c0c0c0c0c0c0c0c001",
  "items": [...],
  "totalAmount": 45.99,
  "deliveryAddress": {...},
  "timestamp": "2024-03-15T14:00:00Z"
}
```

## 🏗️ Project Structure

```
restaurant-service/
├── config/
│   ├── db.js                # MongoDB connection
│   └── kafka.js             # Kafka configuration
├── controllers/
│   ├── restaurant.controller.js  # Restaurant CRUD operations
│   ├── menu.controller.js        # Menu management
│   └── kitchen.controller.js     # Kitchen order operations
├── middleware/
│   ├── auth.js               # JWT verification
│   ├── roleCheck.js          # Role-based access control
│   └── ownerCheck.js         # Restaurant ownership verification
├── repositories/
│   ├── restaurant.repository.js  # Restaurant DB operations
│   ├── menu.repository.js        # Menu DB operations
│   └── kitchen.repository.js     # Kitchen order DB operations
├── routes/
│   ├── restaurant.routes.js      # Restaurant endpoints
│   └── index.routes.js           # Route aggregation
├── services/
│   ├── restaurant.service.js     # Business logic
│   └── kafka.service.js          # Kafka event handlers
├── handlers/
│   └── restaurant.handlers.js    # Kafka message handlers
├── utils/
│   ├── kafka.utils.js            # Kafka helper functions
│   ├── logger.js                 # Winston logger
│   └── dataTransformation.js     # Data formatting utilities
├── app.js                    # Express app configuration
├── server.js                 # Server entry point with Kafka init
├── package.json
└── Dockerfile
```

## 🧪 Example Test Data

**Restaurant Owners (from mock-data.js):**

| Restaurant | Email | Password | Owner ID |
|-----------|-------|----------|----------|
| Mario's Pizza Palace | `mario@pizzapalace.com` | `password` | 65f2d6c0c0c0c0c0c0c0c100 |
| Burger Junction | `burger@junction.com` | `password` | 65f2d6c0c0c0c0c0c0c0c101 |
| Thai Garden | `thai@garden.com` | `password` | 65f2d6c0c0c0c0c0c0c0c102 |

## 🐳 Docker Deployment

Build the Docker image:

```bash
docker build -t restaurant-service .
```

Run the container:

```bash
docker run -p 5006:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/food-delivery \
  -e JWT_SECRET=your-secret \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  restaurant-service
```

**Note:** The Dockerfile exposes port 3000, so map it to 5006 on the host.

## 🔒 Security Features

*   **JWT Verification:** All authenticated endpoints verify tokens
*   **Owner Verification:** Restaurant owners can only modify their own data
*   **Role-Based Access:** Only `restaurant` role can manage menus
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
*   Verify `KAFKA_BROKERS` address is correct
*   Check network connectivity to Kafka
*   Look for connection errors in logs

**Orders not appearing in kitchen:**
*   Verify order-service is publishing to `order-confirmed` topic
*   Check Kafka consumer is connected (look for Kafka logs on startup)
*   Ensure restaurant ID in order matches existing restaurant

**Cannot mark order as ready:**
*   Verify JWT token is valid
*   Check user has `restaurant` role
*   Ensure order exists and belongs to user's restaurant
*   Check Kafka producer connection

**CORS errors:**
*   Add frontend URL to `FRONTEND_URL` in `.env`
*   Verify origin matches exactly

## 🔗 Dependencies on Other Services

*   **MongoDB:** Required for data persistence
*   **Kafka:** Required for event-driven communication
*   **User Service:** JWT token verification (shared secret)
*   **Order Service:** Receives `order-confirmed` events
*   **Delivery Service:** Sends `food-ready` events
