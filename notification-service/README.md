# Notification Service

Notification management microservice for the Food Delivery platform. Consumes events from all Kafka topics and generates notifications for users.

## 🛠️ Tech Stack

### Core
*   **Runtime:** Node.js 20.x
*   **Framework:** Express.js 5.1.0
*   **Language:** JavaScript (ES Modules)

### Message Broker
*   **Kafka:** KafkaJS 2.2.4 for event-driven communication
*   **Consumer Topics:** ALL topics (comprehensive notification coverage)
    - `order-created`
    - `payment-processed`
    - `order-confirmed`
    - `food-ready`
    - `delivery-assigned`
    - `delivery-picked-up`
    - `delivery-completed`

### Middleware & Utilities
*   **CORS:** cors 2.8.5
*   **Logging:** Winston 3.18.3 + Morgan 1.10.1
*   **UUID:** uuid 10.0.0 (notification ID generation)

### Architecture
*   **Stateless:** No database persistence (simulation/log-based)
*   **Event-Driven:** Listens to all system events via Kafka
*   **In-Memory:** Notifications stored temporarily in memory

## ✨ Features

*   **Multi-Topic Consumer:** Listens to all Kafka topics for comprehensive event coverage
*   **Event-to-Notification Mapping:** Automatically generates appropriate notifications for each event type
*   **User-Specific Notifications:** Routes notifications to customers, restaurants, and drivers
*   **Notification Types:**
    - Order confirmations
    - Payment confirmations
    - Food preparation updates
    - Delivery assignments
    - Delivery status updates
    - Order completions
*   **Simulation Mode:** Logs notifications instead of sending emails/SMS (configurable for production)
*   **Notification API:** REST endpoints for retrieving and managing notifications
*   **Statistics:** Track notification counts and types
*   **Health Checks:** Kubernetes-ready health endpoint

## 📋 Prerequisites

*   **Node.js:** 20.x or higher
*   **Kafka:** Running Kafka broker (localhost:9092 or configured cluster)
*   **npm:** 9.x or higher
*   **No Database Required:** This service operates in memory

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd notification-service
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `notification-service` directory:

```env
# Server Configuration
PORT=5003
SERVICE_NAME=notification-service
NODE_ENV=development

# Kafka Configuration
KAFKA_CLIENT_ID=notification-service
KAFKA_BROKERS=localhost:9092

# Kafka Topics (all topics this service consumes from)
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
| `PORT` | No | `5003` | Port number for the service |
| `SERVICE_NAME` | No | `notification-service` | Service identifier for logging |
| `NODE_ENV` | No | `development` | Environment mode |
| `KAFKA_CLIENT_ID` | No | `notification-service` | Kafka client identifier |
| `KAFKA_BROKERS` | No | `localhost:9092` | Comma-separated list of Kafka brokers |
| `TOPIC_ORDER_CREATED` | No | `order-created` | Topic for order creation events |
| `TOPIC_PAYMENT_PROCESSED` | No | `payment-processed` | Topic for payment events |
| `TOPIC_ORDER_CONFIRMED` | No | `order-confirmed` | Topic for order confirmation events |
| `TOPIC_FOOD_READY` | No | `food-ready` | Topic for food preparation completion |
| `TOPIC_DELIVERY_ASSIGNED` | No | `delivery-assigned` | Topic for delivery assignments |
| `TOPIC_DELIVERY_PICKED_UP` | No | `delivery-picked-up` | Topic for pickup events |
| `TOPIC_DELIVERY_COMPLETED` | No | `delivery-completed` | Topic for delivery completion |
| `FRONTEND_URL` | No | (see defaults) | Comma-separated list of allowed frontend origins |

### 3. Start Kafka (Required)

Make sure Kafka is running. If using Docker:

```bash
# From project root
docker-compose up -d kafka zookeeper
```

### 4. Run Development Server

```bash
npm run dev
```

The service will start at **`http://localhost:5003`** and automatically:
- Connect to Kafka broker
- Subscribe to ALL configured topics
- Begin consuming and logging events

### 5. Run Production Server

```bash
npm start
```

## 📡 API Endpoints

### Notification Management

```
GET    /api/notifications              - List all notifications (in-memory)
GET    /api/notifications/:id          - Get notification by ID
PUT    /api/notifications/:id/read     - Mark notification as read
PUT    /api/notifications/read-all     - Mark all notifications as read
GET    /api/notifications/stats        - Get notification statistics
POST   /api/notifications/send         - Send custom notification (manual)
```

### Health Check

```
GET    /health                         - Health check endpoint
```

## 🎯 Kafka Event Consumption

### Consumed Event Topics

The notification service listens to **ALL** Kafka topics to provide comprehensive notification coverage:

1. **order-created** → "Order placed successfully"
2. **payment-processed** → "Payment confirmed for order"
3. **order-confirmed** → "Restaurant received your order"
4. **food-ready** → "Your food is ready for pickup"
5. **delivery-assigned** → "Driver assigned to your order"
6. **delivery-picked-up** → "Driver picked up your order"
7. **delivery-completed** → "Order delivered successfully"

### Event Handler Flow

```
Kafka Event → Notification Handler → Parse Event Data → Generate Notification → Log/Store → (Future: Send Email/SMS/Push)
```

## 🔔 Notification Types

### Customer Notifications
*   Order confirmation
*   Payment confirmation
*   Food preparation status
*   Delivery assignment
*   Order pickup notification
*   Delivery completion

### Restaurant Notifications
*   New order received
*   Payment confirmed
*   Delivery driver assigned
*   Order picked up by driver

### Driver Notifications
*   Delivery assignment
*   Food ready for pickup
*   New delivery request

## 🏗️ Project Structure

```
notification-service/
├── config/
│   └── kafka.js                  # Kafka configuration & topic definitions
├── controllers/
│   └── notification.controller.js  # API endpoint handlers
├── handlers/
│   └── notification.handlers.js   # Kafka event handlers
├── routes/
│   ├── notification.routes.js     # Notification endpoints
│   └── index.routes.js            # Route aggregation
├── services/
│   └── notification.service.js    # Notification business logic
├── utils/
│   ├── kafka.utils.js             # Kafka helper functions
│   └── logger.js                  # Winston logger
├── app.js                         # Express app configuration
├── server.js                      # Server entry point with Kafka init
├── package.json
└── Dockerfile
```

## 💾 Storage Strategy

**Current Implementation (Development):**
*   In-memory storage using JavaScript `Map`
*   Notifications cleared on service restart
*   Suitable for development and testing

**Production Recommendations:**
*   Add database (MongoDB/PostgreSQL) for persistence
*   Implement notification delivery providers (SendGrid, Twilio, FCM)
*   Add retry logic for failed deliveries
*   Implement notification preferences per user

## 🐳 Docker Deployment

Build the Docker image:

```bash
docker build -t notification-service .
```

Run the container:

```bash
docker run -p 5003:3000 \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  notification-service
```

**Note:** The Dockerfile exposes port 3000, so map it to 5003 on the host.

## 📊 Notification Statistics

The `/api/notifications/stats` endpoint provides:
*   Total notification count
*   Breakdown by notification type
*   Breakdown by user/recipient
*   Read vs unread counts
*   Recent notification activity

## 📝 Available Scripts

*   `npm start` - Start production server
*   `npm run dev` - Start development server with nodemon

## 🔧 Troubleshooting

**Kafka connection error:**
*   Ensure Kafka broker is running: `docker-compose ps`
*   Verify `KAFKA_BROKERS` address is correct
*   Check network connectivity to Kafka
*   Look for connection errors in service logs

**No notifications appearing:**
*   Verify other services are publishing events to Kafka
*   Check that Kafka consumer is connected (look for Kafka logs on startup)
*   Ensure topic names match across all services
*   Check Kafka logs: `docker-compose logs kafka`

**Notifications not for correct user:**
*   Verify event payload contains correct `customerId`, `restaurantId`, or `driverId`
*   Check notification handler logic in `handlers/notification.handlers.js`

**Memory issues (too many notifications):**
*   Implement cleanup logic to remove old notifications
*   Consider adding database persistence
*   Limit in-memory storage size

**CORS errors:**
*   Add frontend URL to `FRONTEND_URL` in `.env`
*   Verify origin matches exactly

## 🚀 Future Enhancements

**Delivery Channels:**
*   Email notifications via SendGrid/Mailgun
*   SMS notifications via Twilio
*   Push notifications via Firebase Cloud Messaging
*   WebSocket real-time notifications

**Persistence:**
*   Add MongoDB/PostgreSQL for notification storage
*   Implement notification history
*   Add notification preferences per user

**Features:**
*   Notification scheduling
*   Batch notifications
*   Notification templates
*   Multi-language support
*   User notification preferences

## 🔗 Dependencies on Other Services

*   **Kafka:** Required for event consumption
*   **All Services:** Consumes events from:
    - Order Service
    - Payment Service
    - Restaurant Service
    - Delivery Service
*   **No Database:** Currently stateless (in-memory only)
*   **Frontends:** CORS configuration for API access

## 📖 Example Notification Flow

```
1. Customer places order
   → order-service publishes "order-created"
   → notification-service receives event
   → Generates: "Order #123 placed successfully" (customer)
   → Generates: "New order received from John" (restaurant)

2. Payment processed
   → payment-service publishes "payment-processed"
   → notification-service receives event
   → Generates: "Payment of $45.99 confirmed" (customer)

3. Restaurant confirms order
   → order-service publishes "order-confirmed"
   → notification-service receives event
   → Generates: "Your order is being prepared" (customer)

4. Food ready
   → restaurant-service publishes "food-ready"
   → notification-service receives event
   → Generates: "Food ready for pickup" (driver)
   → Generates: "order is ready for delivery" (customer)

5. Delivery assigned
   → delivery-service publishes "delivery-assigned"
   → notification-service receives event
   → Generates: "Driver Sarah assigned" (customer)
   → Generates: "New delivery assignment" (driver)

6. Order delivered
   → delivery-service publishes "delivery-completed"
   → notification-service receives event
   → Generates: "Order delivered! Enjoy your meal" (customer)
   → Generates: "Delivery completed" (restaurant)
   → Generates: "Delivery completed. Earnings: $8.50" (driver)
```
