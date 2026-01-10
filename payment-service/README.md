# Payment Service

Payment processing microservice for the Food Delivery platform. Handles Stripe payment integration and payment event publishing.

## 🛠️ Tech Stack

### Core
*   **Runtime:** Node.js 20.x
*   **Framework:** Express.js 5.1.0
*   **Language:** JavaScript (ES Modules)

### Database
*   **Database:** MongoDB (via Mongoose 8.20.0)
*   **ODM:** Mongoose with schema validation

### Payment Processing
*   **Stripe:** stripe 19.1.0 for payment processing
*   **Payment Methods:** Credit/debit cards via Stripe Checkout

### Message Broker
*   **Kafka:** KafkaJS 2.2.4 for event-driven communication
*   **Producer Topics:** `payment-processed`
*   **Consumer Topics:** `order-created`

### Security & Middleware
*   **JWT:** jsonwebtoken 9.0.2 (token verification)
*   **CORS:** cors 2.8.5
*   **Logging:** Winston 3.18.3 + Morgan 1.10.1

## ✨ Features

*   **Stripe Integration:** Full Stripe Checkout session creation
*   **Automatic Payment Processing:** Consumes order events and creates checkout sessions
*   **Payment Tracking:** Store and retrieve payment records
*   **Webhook Handling:** Process Stripe webhook events for payment confirmations
*   **Payment Statistics:** View payment analytics and metrics
*   **Kafka Integration:**
    - Consume `order-created` events (triggers payment creation)
    - Publish `payment-processed` events (triggers order confirmation)
*   **Multi-Service Communication:** Fetch order and restaurant details
*   **Payment Methods:** Support for various payment methods via Stripe
*   **Health Checks:** Kubernetes-ready health endpoint

## 📋 Prerequisites

*   **Node.js:** 20.x or higher
*   **MongoDB:** 5.0 or higher (running instance)
*   **Kafka:** Running Kafka broker (localhost:9092 or configured cluster)
*   **Stripe Account:** Active Stripe account with API keys
*   **npm:** 9.x or higher

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd payment-service
npm install
```

### 2. Set Up Stripe Account

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
3. Configure webhook endpoint (optional, for production)

### 3. Configure Environment Variables

Create a `.env` file in the `payment-service` directory:

```env
# Server Configuration
PORT=5002
SERVICE_NAME=payment-service
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/food-delivery
DATABASE_URL=mongodb://localhost:27017/food-delivery

# JWT Configuration (for verifying tokens)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Service URLs
ORDER_SERVICE_URL=http://localhost:5001
RESTAURANT_SERVICE_URL=http://localhost:5006

# Frontend URLs
CUSTOMER_FRONTEND_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Kafka Configuration
KAFKA_CLIENT_ID=payment-service
KAFKA_BROKERS=localhost:9092

# Kafka Topics
TOPIC_ORDER_CREATED=order-created
TOPIC_PAYMENT_PROCESSED=payment-processed
```

**Environment Variable Details:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5002` | Port number for the service |
| `SERVICE_NAME` | No | `payment-service` | Service identifier for logging |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `DATABASE_URL` | No | - | Alternative MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | Secret key for verifying JWT tokens (must match user-service) |
| `STRIPE_SECRET_KEY` | **Yes** | - | Stripe Secret API key (starts with `sk_test_` or `sk_live_`) |
| `STRIPE_WEBHOOK_SECRET` | No | - | Stripe webhook signing secret (for webhook verification) |
| `ORDER_SERVICE_URL` | No | `http://localhost:5001` | Order service endpoint |
| `RESTAURANT_SERVICE_URL` | No | `http://localhost:5006` | Restaurant service endpoint |
| `CUSTOMER_FRONTEND_URL` | No | (see FRONTEND_URL) | Customer frontend URL for redirects |
| `FRONTEND_URL` | No | (see defaults) | Comma-separated list of allowed frontend origins |
| `KAFKA_CLIENT_ID` | No | `payment-service` | Kafka client identifier |
| `KAFKA_BROKERS` | No | `localhost:9092` | Comma-separated list of Kafka brokers |
| `TOPIC_ORDER_CREATED` | No | `order-created` | Topic to consume order creation events |
| `TOPIC_PAYMENT_PROCESSED` | No | `payment-processed` | Topic to publish payment completion events |

### 4. Seed Database (Optional)

From the backend root directory:

```bash
cd ..
node seed-mongodb.mjs
```

### 5. Start Dependencies

**Start Kafka:**
```bash
docker-compose up -d kafka zookeeper
```

**Start Order Service:**
```bash
cd ../order-service
npm run dev
```

### 6. Run Development Server

```bash
npm run dev
```

The service will start at **`http://localhost:5002`**

### 7. Run Production Server

```bash
npm start
```

## 📡 API Endpoints

### Payment Processing

```
POST   /api/payment-service/payments           - Create Stripe checkout session (auth required)
GET    /api/payment-service/payments/:orderId  - Get payment by order ID (auth required)
GET    /api/payment-service/payments           - List all payments (admin)
GET    /api/payment-service/payments/stats     - Get payment statistics
GET    /api/payment-service/payments/methods   - Get available payment methods
```

### Stripe Webhooks

```
POST   /api/payment-service/webhook            - Stripe webhook endpoint (for production)
```

### Health Check

```
GET    /health                                  - Health check endpoint
```

## 🎯 Kafka Event Flow

### Consumed Events

**Topic:** `order-created`
```json
{
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "customerId": "65f2d6c0c0c0c0c0c0c0c010",
  "restaurantId": "65f2d6c0c0c0c0c0c0c0c001",
  "items": [...],
  "totalAmount": 28.97,
  "deliveryAddress": {...},
  "status": "PENDING_PAYMENT",
  "timestamp": "2024-03-15T14:00:00Z"
}
```

**Action:** Automatically creates Stripe checkout session and sends URL to customer

### Published Events

**Topic:** `payment-processed`
```json
{
  "orderId": "65f2d6c0c0c0c0c0c0c0e001",
  "customerId": "65f2d6c0c0c0c0c0c0c0c010",
  "paymentId": "65f2d6c0c0c0c0c0c0c0d001",
  "stripeSessionId": "cs_test_abc123",
  "amount": 28.97,
  "currency": "usd",
  "status": "SUCCESS",
  "paymentMethod": "card",
  "timestamp": "2024-03-15T14:05:00Z"
}
```

**Trigger:** Published after successful Stripe payment completion

## 💳 Stripe Payment Flow

### Development/Testing Flow

```
1. Customer places order
   ↓
2. Payment Service receives "order-created" event
   ↓
3. Creates Stripe Checkout Session with order details
   ↓
4. Returns session URL to customer frontend
   ↓
5. Customer redirected to Stripe Checkout page
   ↓
6. Customer enters payment details (use Stripe test cards)
   ↓
7. Stripe processes payment
   ↓
8. Customer redirected back to success/cancel URL
   ↓
9. Payment Service publishes "payment-processed" event
   ↓
10. Order Service updates order status to CONFIRMED
```

### Stripe Test Cards

Use these test card numbers in development:

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Visa - Always succeeds |
| `4000 0025 0000 3155` | Visa - Requires authentication |
| `4000 0000 0000 9995` | Visa - Always declined |

**Expiry:** Any future date  
**CVC:** Any 3 digits  
**ZIP:** Any 5 digits

## 🏗️ Project Structure

```
payment-service/
├── config/
│   ├── db.js              # MongoDB connection
│   ├── kafka.js           # Kafka configuration
│   └── stripe.js          # Stripe client initialization
├── controllers/
│   ├── payment.controller.js  # Payment API endpoints
│   └── webhook.controller.js  # Stripe webhook handler
├── middleware/
│   └── auth.js            # JWT verification
├── repositories/
│   └── payment.repository.js  # Payment DB operations
├── routes/
│   ├── payment.routes.js  # Payment endpoints
│   └── index.routes.js    # Route aggregation
├── services/
│   ├── payment.service.js # Payment business logic
│   └── webhook.service.js # Webhook processing
├── handlers/
│   └── payment.handlers.js    # Kafka event handlers
├── utils/
│   ├── kafka.utils.js     # Kafka helper functions
│   └── logger.js          # Winston logger
├── app.js                 # Express app configuration
├── server.js              # Server entry point with Kafka init
├── package.json
└── Dockerfile
```

## 🐳 Docker Deployment

Build the Docker image:

```bash
docker build -t payment-service .
```

Run the container:

```bash
docker run -p 5002:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/food-delivery \
  -e JWT_SECRET=your-secret \
  -e STRIPE_SECRET_KEY=sk_test_your_key \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  -e ORDER_SERVICE_URL=http://host.docker.internal:5001 \
  -e CUSTOMER_FRONTEND_URL=http://localhost:5173 \
  payment-service
```

**Note:** The Dockerfile exposes port 3000, so map it to 5002 on the host.

## 🔒 Security Features

*   **JWT Verification:** All authenticated endpoints verify tokens
*   **Stripe Webhook Verification:** Validates webhook signatures
*   **PCI Compliance:** Never stores credit card details (handled by Stripe)
*   **CORS:** Configurable origin whitelist
*   **Secure Redirects:** Uses environment-configured frontend URLs

## 📝 Available Scripts

*   `npm start` - Start production server
*   `npm run dev` - Start development server with nodemon

## 🔧 Troubleshooting

**Stripe API key error:**
*   Verify `STRIPE_SECRET_KEY` is set correctly in `.env`
*   Ensure key starts with `sk_test_` (test) or `sk_live_` (production)
*   Check key hasn't been rotated in Stripe dashboard

**Payment not creating checkout session:**
*   Verify order-service is publishing `order-created` events
*   Check Kafka consumer is connected
*   Ensure order service and restaurant service are accessible
*   Look for errors in payment service logs

**Webhook not working:**
*   In development, webhooks aren't required (manual status updates work)
*   For production, configure `STRIPE_WEBHOOK_SECRET`
*   Use Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:5002/api/payment-service/webhook`

**Payment processed but order not confirmed:**
*   Verify Kafka producer is connected
*   Check that `payment-processed` event is being published
*   Ensure order-service is consuming the topic
*   Verify topic names match across services

**Redirect URLs not working:**
*   Check `CUSTOMER_FRONTEND_URL` points to correct frontend
*   Ensure frontend is running on specified port
*   Verify success/cancel routes exist in frontend

## 🔗 Dependencies on Other Services

*   **MongoDB:** Required for payment record storage
*   **Kafka:** Required for event-driven communication
*   **Stripe:** Required for payment processing
*   **Order Service:** Fetches order details for payment creation
*   **Restaurant Service:** Fetches restaurant details for payment description
*   **User Service:** JWT token verification (shared secret)

## 💡 Payment Workflow Example

```
Customer Cart Total: $28.97
├── Subtotal: $25.98 (2x Margherita Pizza)
└── Delivery Fee: $2.99

1. Order created (status: PENDING_PAYMENT)
2. Payment Service creates Stripe session
3. Customer redirected to Stripe Checkout
4. Enters: 4242 4242 4242 4242 (test card)
5. Payment succeeds on Stripe
6. Customer redirected to /order-success
7. Payment Service publishes "payment-processed"
8. Order Service updates status to CONFIRMED
9. Kitchen receives order
```

## 🌐 Stripe Checkout Session Details

**Session includes:**
*   Order line items with quantities and prices
*   Customer email (from user profile)
*   Order metadata (orderId, customerId, restaurantId)
*   Success redirect URL with session_id
*   Cancel redirect URL
*   Payment method types: card
*   Currency: USD
*   Mode: payment (one-time)
