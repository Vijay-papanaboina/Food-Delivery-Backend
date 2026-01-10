# User Service

User authentication and profile management microservice for the Food Delivery platform.

## 🛠️ Tech Stack

### Core
*   **Runtime:** Node.js 20.x
*   **Framework:** Express.js 4.18.2
*   **Language:** JavaScript (ES Modules)

### Database
*   **Database:** MongoDB (via Mongoose 8.20.0)
*   **ODM:** Mongoose with schema validation

### Security & Authentication
*   **Password Hashing:** bcrypt 5.1.1
*   **JWT:** jsonwebtoken 9.0.2
*   **Security Headers:** Helmet 7.1.0
*   **Rate Limiting:** express-rate-limit 7.1.5
*   **CORS:** cors 2.8.5

### Validation & Middleware
*   **Validation:** express-validator 7.0.1
*   **Cookie Parser:** cookie-parser 1.4.7
*   **Logging:** Winston 3.18.3 + Morgan 1.10.1

## ✨ Features

*   **User Registration:** Create new user accounts with email validation
*   **Authentication:** Login with JWT access tokens and refresh tokens (HTTP-only cookies)
*   **Role-Based Access Control:** Support for `customer`, `restaurant`, and `driver` roles
*   **Token Management:** Automatic token refresh mechanism
*   **Password Security:** Bcrypt hashing with salt rounds
*   **Profile Management:** Update user information and manage addresses
*   **Cart Management:** Persistent cart for authenticated users (synced with database)
*   **Domain Validation:** Optional domain-based login restrictions for different roles
*   **Rate Limiting:** Protection against brute-force attacks
*   **Health Checks:** Kubernetes-ready health endpoint

## 📋 Prerequisites

*   **Node.js:** 20.x or higher
*   **MongoDB:** 5.0 or higher (running instance)
*   **npm:** 9.x or higher

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd user-service
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `user-service` directory:

```env
# Server Configuration
PORT=5005
SERVICE_NAME=user-service
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/food-delivery
DATABASE_URL=mongodb://localhost:27017/food-delivery

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=1h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-in-production
REFRESH_TOKEN_EXPIRY=7d

# Frontend URLs (comma-separated for CORS)
FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Optional: Domain-based login restrictions
CUSTOMER_DOMAIN=http://localhost:5173
RESTAURANT_DOMAIN=http://localhost:5174
DELIVERY_DOMAIN=http://localhost:5175
```

**Environment Variable Details:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5005` | Port number for the service |
| `SERVICE_NAME` | No | `user-service` | Service identifier for logging |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `DATABASE_URL` | No | - | Alternative MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | Secret key for signing JWT access tokens |
| `JWT_EXPIRY` | No | `1h` | Access token expiration time |
| `REFRESH_TOKEN_SECRET` | **Yes** | - | Secret key for signing refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | No | `7d` | Refresh token expiration time |
| `FRONTEND_URL` | No | (see defaults) | Comma-separated list of allowed frontend origins |
| `CUSTOMER_DOMAIN` | No | - | Optional domain restriction for customer logins |
| `RESTAURANT_DOMAIN` | No | - | Optional domain restriction for restaurant logins |
| `DELIVERY_DOMAIN` | No | - | Optional domain restriction for delivery logins |

### 3. Seed Database (Optional)

From the backend root directory, run the MongoDB seed script:

```bash
# Make sure MongoDB is running
cd ..
node seed-mongodb.mjs
```

This will populate the database with test users from `mock-data.js`.

### 4. Run Development Server

```bash
npm run dev
```

The service will start at **`http://localhost:5005`**

### 5. Run Production Server

```bash
npm start
```

## 📡 API Endpoints

### Authentication

```
POST   /api/user-service/auth/register        - Register new user
POST   /api/user-service/auth/login           - Login user
POST   /api/user-service/auth/logout          - Logout user
POST   /api/user-service/auth/refresh-token   - Refresh access token
GET    /api/user-service/auth/verify          - Verify current token
```

### User Profile

```
GET    /api/user-service/users/profile        - Get current user profile
PUT    /api/user-service/users/profile        - Update user profile
GET    /api/user-service/users/:id            - Get user by ID (admin)
```

### Cart Management

```
GET    /api/user-service/users/cart           - Get user's cart
PUT    /api/user-service/users/cart           - Update user's cart
POST   /api/user-service/users/cart/items     - Add item to cart
DELETE /api/user-service/users/cart/items/:id - Remove item from cart
```

### Address Management

```
GET    /api/user-service/users/addresses          - Get all addresses
POST   /api/user-service/users/addresses          - Add new address
PUT    /api/user-service/users/addresses/:id      - Update address
DELETE /api/user-service/users/addresses/:id      - Delete address
PUT    /api/user-service/users/addresses/:id/default - Set default address
```

### Health Check

```
GET    /api/user-service/health               - Health check endpoint
```

## 🧪 Example Test Users

All test users have the password: `password`

**Customers:**
| Name | Email | Role |
|------|-------|------|
| John Doe | `john@example.com` | customer |
| Jane Smith | `jane@example.com` | customer |

**Restaurant Owners:**
| Name | Email | Role | Restaurant |
|------|-------|------|-----------|
| Mario Rossi | `mario@pizzapalace.com` | restaurant | Mario's Pizza Palace |
| Burger Master | `burger@junction.com` | restaurant | Burger Junction |
| Thai Chef | `thai@garden.com` | restaurant | Thai Garden |

**Drivers:**
| Name | Email | Role |
|------|-------|------|
| Sarah Johnson | `sarah.johnson@driver.com` | driver |
| John Smith | `john.smith@driver.com` | driver |
| Mike Davis | `mike.davis@driver.com` | driver |

## 🏗️ Project Structure

```
user-service/
├── config/
│   ├── db.js              # MongoDB connection
│   └── jwt.js             # JWT configuration
├── controllers/
│   ├── auth.controller.js   # Authentication logic
│   ├── cart.controller.js   # Cart operations
│   └── user.controller.js   # User profile operations
├── middleware/
│   ├── auth.js              # JWT verification middleware
│   ├── roleCheck.js         # Role-based access control
│   └── validation.js        # Request validation middleware
├── repositories/
│   ├── user.repository.js   # Database operations
│   └── cart.repository.js   # Cart database operations
├── routes/
│   ├── auth.routes.js       # Auth endpoints
│   ├── user.routes.js       # User endpoints
│   ├── cart.routes.js       # Cart endpoints
│   └── index.routes.js      # Route aggregation
├── services/
│   ├── auth.service.js      # Business logic for auth
│   ├── token.service.js     # Token generation & validation
│   └── user.service.js      # Business logic for users
├── utils/
│   ├── domainValidator.js   # Domain-based login validation
│   ├── logger.js            # Winston logger configuration
│   └── validators.js        # Custom validation functions
├── app.js                   # Express app configuration
├── server.js                # Server entry point
├── package.json
└── Dockerfile
```

## 🐳 Docker Deployment

Build the Docker image:

```bash
docker build -t user-service .
```

Run the container:

```bash
docker run -p 5005:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/food-delivery \
  -e JWT_SECRET=your-secret \
  -e REFRESH_TOKEN_SECRET=your-refresh-secret \
  user-service
```

**Note:** The Dockerfile exposes port 3000, so map it to 5005 on the host.

## 🔒 Security Features

*   **Password Hashing:** Bcrypt with 12 salt rounds
*   **JWT Tokens:** Short-lived access tokens (1h default)
*   **Refresh Tokens:** HTTP-only cookies, longer expiration (7d default)
*   **Rate Limiting:** 60 requests per minute per IP
*   **Helmet:** Security headers protection
*   **CORS:** Configurable origin whitelist
*   **Input Validation:** Express-validator for all inputs
*   **Domain Validation:** Optional role-based domain restrictions

## 📝 Available Scripts

*   `npm start` - Start production server
*   `npm run dev` - Start development server with nodemon

## 🔧 Troubleshooting

**MongoDB connection error:**
*   Ensure MongoDB is running: `mongod` or via Docker
*   Check connection string in `.env`
*   Verify network connectivity to MongoDB host

**JWT token errors:**
*   Ensure `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are set
*   Check token expiration settings
*   Verify cookies are being sent with requests (credentials: true)

**CORS errors:**
*   Add frontend URL to `FRONTEND_URL` environment variable
*   Check that frontend is sending credentials
*   Verify origin matches exactly (including protocol and port)

**Rate limiting triggering:**
*   Increase `max` value in `app.js` rate limiter configuration
*   Clear IP-based rate limit cache by restarting service

## 🔗 Dependencies on Other Services

*   **MongoDB:** Required for data persistence
*   **Frontend Applications:** Customer, Restaurant, and Courier frontends
*   None (User service is standalone, doesn't depend on other microservices)
