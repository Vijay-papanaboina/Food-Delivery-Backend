#!/bin/bash

# Food Ordering Microservices - Startup Script
# This script starts all 6 microservices in separate terminals

echo "🚀 Starting Food Ordering Microservices System"
echo "=============================================="
echo "📁 Current working directory: $(pwd)"

# Check if Kafka is running
echo "📋 Checking if Kafka is running..."
if ! docker-compose ps | grep -q "kafka.*Up"; then
    echo "⚠️  Kafka is not running. Starting Kafka..."
    docker-compose up -d
    echo "⏳ Waiting for Kafka to be ready..."
    sleep 30
else
    echo "✅ Kafka is already running"
fi

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local service_path="$service_name"
    
    echo "🔧 Starting $service_name on port $port..."
    echo "📁 Checking directory: $service_path"
    
    # Check if service directory exists
    if [ ! -d "$service_path" ]; then
        echo "❌ Service directory not found: $service_path"
        echo "📁 Available directories: $(ls -d */ 2>/dev/null | tr '\n' ' ')"
        return 1
    fi
    
    # Check if package.json exists
    if [ ! -f "$service_path/package.json" ]; then
        echo "❌ package.json not found in $service_path"
        return 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "$service_path/node_modules" ]; then
        echo "📦 Installing dependencies for $service_name..."
        cd "$service_path" && npm install && cd - > /dev/null
    fi
    
    # Start service in background
    cd "$service_path"
    npm run dev &
    local pid=$!
    echo "✅ $service_name started with PID: $pid"
    cd - > /dev/null
    
    # Store PID for cleanup
    echo $pid >> /tmp/microservices.pids
    
    # Wait a moment before starting next service
    sleep 2
}

# Create PID file
> /tmp/microservices.pids

# Start all services
echo ""
echo "🏗️  Starting all microservices..."
echo "================================"

start_service "order-service" "5001"
start_service "payment-service" "5002" 
start_service "notification-service" "5003"
start_service "delivery-service" "5004"
# inventory-service removed
start_service "restaurant-service" "5006"

echo ""
echo "🎉 All services started successfully!"
echo "===================================="
echo ""
echo "📋 Service URLs:"
echo "   Order Service:      http://localhost:5001"
echo "   Payment Service:    http://localhost:5002"
echo "   Notification Service: http://localhost:5003"
echo "   Delivery Service:   http://localhost:5004"
echo "   Inventory Service:  http://localhost:5005"
echo "   Restaurant Service: http://localhost:5006 (includes Kitchen)"
echo ""
echo "🔍 Health Check URLs:"
echo "   curl http://localhost:5001/health"
echo "   curl http://localhost:5002/health"
echo "   curl http://localhost:5003/health"
echo "   curl http://localhost:5004/health"
echo "   curl http://localhost:5005/health"
echo "   curl http://localhost:5006/health"
echo ""
echo "📚 API Documentation:"
echo "   See microservices/README.md for detailed API documentation"
echo ""
echo "🛑 To stop all services:"
echo "   ./stop-all-services.sh"
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check if services are responding
echo "🔍 Checking service health..."
services=("5001:Order" "5002:Payment" "5003:Notification" "5004:Delivery" "5006:Restaurant")

for service in "${services[@]}"; do
    port=$(echo $service | cut -d: -f1)
    name=$(echo $service | cut -d: -f2)
    
    if curl -s http://localhost:$port/health > /dev/null; then
        echo "✅ $name Service (port $port) - Healthy"
    else
        echo "⚠️  $name Service (port $port) - Not responding"
    fi
done

echo ""
echo "🎯 Ready to test! Try creating an order:"
echo "curl -X POST http://localhost:5001/api/orders \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"restaurantId\": \"rest-001\", \"items\": [{\"itemId\": \"item-001\", \"quantity\": 1, \"price\": 12.99}], \"userId\": \"user-123\", \"deliveryAddress\": \"123 Main St\"}'"
echo ""
echo "Press Ctrl+C to stop all services"
