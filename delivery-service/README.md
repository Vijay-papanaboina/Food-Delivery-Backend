# Delivery Service

Delivery management microservice for the Food Delivery platform. Handles driver assignments, delivery tracking, and delivery lifecycle management.

## 🛠️ Tech Stack

### Core
*   **Runtime:** Node.js 20.x
*   **Framework:** Express.js 5.1.0
*   **Language:** JavaScript (ES Modules)

### Database
*   **Database:** MongoDB (via Mongoose 8.20.0)
*   **ODM:** Mongoose with schema validation

### HTTP Client
*   **Axios:** axios 1.12.2 for service-to-service communication

### Message Broker
*   **Kafka:** KafkaJS 2.2.4 for event-driven communication
*   **Producer Topics:** `delivery-assigned`, `delivery-picked-up`, `delivery-completed`, `delivery-accepted`, `delivery-declined`
*   **Consumer Topics:** `food-ready`

### Security & Middleware
*   **JWT:** jsonwebtoken 9.0.2 (token verification)
*   **CORS:** cors 2.8.5
*   **Logging:** Winston 3.18.3 + Morgan 1.10.1

## ✨ Features

*   **Driver Management:** Track active/inactive drivers and availability
*   **Automatic Assignment:** Auto-assign available drivers when food is ready
*   **Manual Assignment:** Manually assign specific drivers to orders
*   **Driver Selection:** Accept/decline delivery assignments
*   **Delivery Tracking:** Track deliveries through pickup and completion
*   **Delivery History:** View past deliveries for drivers
*   **Earnings Calculation:** Track driver earnings per delivery
*   **Kafka Integration:**
    - Consume `food-ready` events (triggers driver assignment)
    - Publish `delivery-assigned` events
    - Publish `delivery-picked-up` events
    - Publish `delivery-completed` events
    - Publish `delivery-accepted`/`delivery-declined` events
*   **Driver Statistics:** View delivery counts and earnings
*   **Health Checks:** Kubernetes-ready health endpoint

## 📋 Prerequisites

*   **Node.js:** 20.x or higher
*   **MongoDB:** 5.0 or higher (running instance)
*   **Kafka:** Running Kafka broker (localhost:9092 or configured cluster)
*   **npm:** 9.x or higher

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd delivery-service
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `delivery-service` directory:

```env
# Server Configuration
PORT=5004
SERVICE_NAME=delivery-service
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/food-delivery
DATABASE_URL=mongodb://localhost:27017/food-delivery

# JWT Configuration (for verifying tokens)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Kafka Configuration
KAFKA_CLIENT_ID=delivery-service
KAFKA_BROKERS=localhost:9092

# Kafka Topics
TOPIC_FOOD_READY=food-ready
TOPIC_DELIVERY_ASSIGNED=delivery-assigned
TOPIC_DELIVERY_PICKED_UP=delivery-picked-up
TOPIC_DELIVERY_COMPLETED=delivery-completed
TOPIC_DELIVERY_ACCEPTED=delivery-accepted
TOPIC_DELIVERY_DECLINED=delivery-declined
TOPIC_DELIVERY_REASSIGNED=delivery-reassigned
TOPIC_DELIVERY_UNASSIGNED=delivery-unassigned

# Frontend URLs (comma-separated for CORS)
FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

**Environment Variable Details:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5004` | Port number for the service |
| `SERVICE_NAME` | No | `delivery-service` | Service identifier for logging |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `DATABASE_URL` | No | - | Alternative MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | Secret key for verifying JWT tokens (must match user-service) |
| `KAFKA_CLIENT_ID` | No | `delivery-service` | Kafka client identifier |
| `KAFKA_BROKERS` | No | `localhost:9092` | Comma-separated list of Kafka brokers |
| `TOPIC_FOOD_READY` | No | `food-ready` | Topic to consume food ready events |
| `TOPIC_DELIVERY_ASSIGNED` | No | `delivery-assigned` | Topic to publish assignment events |
| `TOPIC_DELIVERY_PICKED_UP` | No | `delivery-picked-up` | Topic to publish pickup events |
| `TOPIC_DELIVERY_COMPLETED` | No | `delivery-completed` | Topic to publish completion events |
| `TOPIC_DELIVERY_ACCEPTED` | No | `delivery-accepted` | Topic for driver acceptance |
| `TOPIC_DELIVERY_DECLINED` | No | `delivery-declined` | Topic for driver declination |
| `TOPIC_DELIVERY_REASSIGNED` | No | `delivery-reassigned` | Topic for reassignment events |
| `TOPIC_DELIVERY_UNASSIGNED` | No | `delivery-unassigned` | Topic for unassignment events |
| `FRONTEND_URL` | No | (see defaults) | Comma-separated list of allowed frontend origins |

### 3. Seed Database (Optional)

From the backend root directory:

```bash
cd ..
node seed-mongodb.mjs
```

This seeds drivers with `available: true` status ready to accept deliveries.

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

The service will start at **`http://localhost:5004`**

### 6. Run Production Server

```bash
npm start
```

## 📡 API Endpoints

### Delivery Management

```
POST   /api/delivery/assign          - Manually assign driver to order (admin)
POST   /api/delivery/:deliveryId/accept   - Driver accepts delivery (auth required)
POST   /api/delivery/:deliveryId/decline  - Driver declines delivery (auth required)
POST   /api/delivery/:deliveryId/pickup   - Mark as picked up from restaurant (auth required)
POST   /api/delivery/:deliveryId/complete - Mark as delivered to customer (auth required)
GET    /api/delivery/:orderId        - Get delivery by order ID
GET    /api/delivery                 - List all deliveries
GET    /api/delivery/driver/:driverId - Get deliveries for specific driver
```

### Driver Management

```
GET    /api/drivers                  - List all drivers
GET    /api/drivers/:id              - Get driver by ID
PUT    /api/drivers/:id/availability - Toggle driver availability (auth required)
GET    /api/drivers/available        - List available drivers
```

### Statistics

```
GET    /api/delivery/stats           - Get delivery statistics
GET    /api/delivery/driver/:driverId/stats - Get driver-specific stats
```

### Health Check

```
GET    /health                       - Health check endpoint
```

## 🎯 Kafka Event Flow

### Consumed Events

**Topic:** `food-ready`
```json
{
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "restaurantId": "65f2d6c0c0c0c0c0c0c0c001",
  "customerId": "65f2d6c0c0c0c0c0c0c0c010",
  "estimatedPickupTime": "2024-03-15T14:30:00Z",
  "deliveryAddress": {
    "street": "123 Oak Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "items": [...],
  "timestamp": "2024-03-15T14:15:00Z"
}
```

**Action:** Automatically finds available driver and assigns delivery

### Published Events

**Topic:** `delivery-assigned`
```json
{
  "deliveryId": "65f2d6c0c0c0c0c0c0c0f001",
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "driverId": "65f2d6c0c0c0c0c0c0c0c200",
  "driverName": "Sarah Johnson",
  "restaurantId": "65f2d6c0c0c0c0c0c0c0c001",
  "customerId": "65f2d6c0c0c0c0c0c0c0c010",
  "pickupAddress": "123 Main St, Downtown",
  "deliveryAddress": "123 Oak Street, New York, NY 10001",
  "assignedAt": "2024-03-15T14:20:00Z",
  "status": "ASSIGNED",
  "timestamp": "2024-03-15T14:20:00Z"
}
```

**Topic:** `delivery-picked-up`
```json
{
  "deliveryId": "65f2d6c0c0c0c0c0c0c0f001",
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "driverId": "65f2d6c0c0c0c0c0c0c0c200",
  "pickedUpAt": "2024-03-15T14:35:00Z",
  "status": "PICKED_UP",
  "timestamp": "2024-03-15T14:35:00Z"
}
```

**Topic:** `delivery-completed`
```json
{
  "deliveryId": "65f2d6c0c0c0c0c0c0c0f001",
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "driverId": "65f2d6c0c0c0c0c0c0c0c200",
  "completedAt": "2024-03-15T15:00:00Z",
  "deliveryFee": 2.99,
  "driverEarnings": 8.50,
  "status": "COMPLETED",
  "timestamp": "2024-03-15T15:00:00Z"
}
```

## 🚗 Delivery Status Lifecycle

```
1. ASSIGNED       → Driver automatically assigned or manually assigned
2. ACCEPTED       → Driver accepts the delivery
3. PICKED_UP      → Driver picks up food from restaurant
4. OUT_FOR_DELIVERY → Driver en route to customer (same as PICKED_UP)
5. COMPLETED      → Driver delivers to customer
6. DECLINED       → Driver declined assignment (reassigned to another driver)
```

## 📊 Driver Earnings Calculation

**Default Earnings Model:**
*   Base Fee: $5.00
*   Distance Rate: $1.50 per mile (if implemented)
*   Peak Hours Multiplier: 1.5x (if implemented)
*   Minimum Earnings: $5.00
*   Platform Fee: 15% (deducted)

**Example:**
```
Delivery Fee to Customer: $2.99
Driver Earnings: $8.50 (configured per delivery)
Platform Keeps: ~$0.45
```

## 🏗️ Project Structure

```
delivery-service/
├── config/
│   ├── db.js              # MongoDB connection
│   └── kafka.js           # Kafka configuration
├── controllers/
│   ├── delivery.controller.js  # Delivery API endpoints
│   └── driver.controller.js    # Driver management
├── middleware/
│   └── auth.js            # JWT verification
├── repositories/
│   ├── delivery.repository.js  # Delivery DB operations
│   └── driver.repository.js    # Driver DB operations
├── routes/
│   ├── delivery.routes.js      # Delivery endpoints
│   ├── driver.routes.js        # Driver endpoints
│   └── index.routes.js         # Route aggregation
├── services/
│   ├── delivery.service.js     # Delivery business logic
│   └── driverAssignment.service.js  # Driver selection algorithm
├── handlers/
│   └── delivery.handlers.js    # Kafka event handlers
├── utils/
│   ├── kafka.utils.js          # Kafka helper functions
│   ├── logger.js               # Winston logger
│   └── distanceCalculator.js   # Distance/earnings helpers
├── app.js                       # Express app configuration
├── server.js                    # Server entry point with Kafka init
├── package.json
└── Dockerfile
```

## 🧪 Example Test Drivers

**From mock-data.js:**

| Name | Email | Password | Availability |
|------|-------|----------|--------------|
| Sarah Johnson | `sarah.johnson@driver.com` | `password` | Available |
| John Smith | `john.smith@driver.com` | `password` | Available |
| Mike Davis | `mike.davis@driver.com` | `password` | Available |

## 🐳 Docker Deployment

Build the Docker image:

```bash
docker build -t delivery-service .
```

Run the container:

```bash
docker run -p 5004:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/food-delivery \
  -e JWT_SECRET=your-secret \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  delivery-service
```

**Note:** The Dockerfile exposes port 3000, so map it to 5004 on the host.

## 🔒 Security Features

*   **JWT Verification:** All authenticated endpoints verify tokens
*   **Driver Authorization:** Drivers can only manage their own deliveries
*   **CORS:** Configurable origin whitelist
*   **Input Validation:** Mongoose schema validation

## 📝 Available Scripts

*   `npm start` - Start production server
*   `npm run dev` - Start development server with nodemon

## 🔧 Troubleshooting

**No drivers being assigned:**
*   Ensure drivers exist in database with `available: true`
*   Run seed script to create drivers: `node seed-mongodb.mjs`
*   Check driver availability status in database
*   Verify `food-ready` events are being published by restaurant-service

**Driver can't accept/decline delivery:**
*   Verify JWT token is valid and belongs to driver
*   Check delivery is in ASSIGNED status
*   Ensure deliveryId matches existing delivery

**Delivery not completing:**
*   Verify delivery is in PICKED_UP status
*   Check JWT token belongs to assigned driver
*   Ensure Kafka producer is connected

**Events not publishing:**
*   Check Kafka connection in logs
*   Verify topic names match across services
*   Ensure Kafka broker is running

## 🔗 Dependencies on Other Services

*   **MongoDB:** Required for delivery and driver data persistence
*   **Kafka:** Required for event-driven communication
*   **Restaurant Service:** Receives `food-ready` events
*   **Order Service:** Sends `delivery-completed` events
*   **User Service:** JWT token verification (shared secret)
*   **Notification Service:** Receives all delivery events for notifications

## 💡 Delivery Workflow Example

```
1. Restaurant marks order as ready
   ↓
2. Restaurant Service publishes "food-ready" event
   ↓
3. Delivery Service consumes event
   ↓
4. Finds available driver (Sarah Johnson)
   ↓
5. Creates delivery record (status: ASSIGNED)
   ↓
6. Publishes "delivery-assigned" event
   ↓
7. Sarah sees delivery in courier app
   ↓
8. Sarah accepts delivery → publishes "delivery-accepted"
   ↓
9. Sarah drives to restaurant
   ↓
10. Sarah marks "Picked Up" → publishes "delivery-picked-up"
    ↓
11. Sarah drives to customer
    ↓
12. Sarah marks "Delivered" → publishes "delivery-completed"
    ↓
13. Order Service updates order status to DELIVERED
    ↓
14. Sarah earns $8.50 for delivery
```

## 🎯 Driver Assignment Algorithm

**Current Implementation:**
1. Find all drivers with `available: true`
2. Select first available driver (FIFO)
3. Create delivery record
4. Publish assignment event

**Future Enhancements:**
*   Distance-based assignment (closest driver)
*   Rating-based assignment (highest-rated drivers)
*   Load bal ancing (fewest active deliveries)
*   Zone-based assignment (drivers in specific areas)
*   Real-time GPS tracking integration
