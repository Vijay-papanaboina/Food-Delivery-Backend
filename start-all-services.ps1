# Food Ordering Microservices - PowerShell Startup Script
# This script starts all 6 microservices

Write-Host "🚀 Starting Food Ordering Microservices System" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Check if Kafka is running
Write-Host "📋 Checking if Kafka is running..." -ForegroundColor Yellow
$kafkaStatus = docker-compose ps | Select-String "kafka.*Up"
if (-not $kafkaStatus) {
    Write-Host "⚠️  Kafka is not running. Starting Kafka..." -ForegroundColor Yellow
    docker-compose up -d
    Write-Host "⏳ Waiting for Kafka to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
} else {
    Write-Host "✅ Kafka is already running" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏗️  Starting all microservices..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Get the script directory for proper path resolution
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Start Order Service
Write-Host "🔧 Starting Order Service on port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\order-service'; npm run dev" -WindowStyle Normal

# Start Payment Service  
Write-Host "🔧 Starting Payment Service on port 5002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\payment-service'; npm run dev" -WindowStyle Normal

# Start Notification Service
Write-Host "🔧 Starting Notification Service on port 5003..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\notification-service'; npm run dev" -WindowStyle Normal

# Start Delivery Service
Write-Host "🔧 Starting Delivery Service on port 5004..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\delivery-service'; npm run dev" -WindowStyle Normal

# Inventory Service removed

# Start Restaurant Service (includes Kitchen operations)
Write-Host "🔧 Starting Restaurant Service on port 5006..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\restaurant-service'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 All services started successfully!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   Order Service:      http://localhost:5001" -ForegroundColor White
Write-Host "   Payment Service:    http://localhost:5002" -ForegroundColor White
Write-Host "   Notification Service: http://localhost:5003" -ForegroundColor White
Write-Host "   Delivery Service:   http://localhost:5004" -ForegroundColor White
Write-Host "   Inventory Service:  removed" -ForegroundColor White
Write-Host "   Restaurant Service: http://localhost:5006 (includes Kitchen)" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Health Check URLs:" -ForegroundColor Cyan
Write-Host "   curl http://localhost:5001/health" -ForegroundColor Gray
Write-Host "   curl http://localhost:5002/health" -ForegroundColor Gray
Write-Host "   curl http://localhost:5003/health" -ForegroundColor Gray
Write-Host "   curl http://localhost:5004/health" -ForegroundColor Gray
Write-Host "   curl http://localhost:5005/health" -ForegroundColor Gray
Write-Host "   curl http://localhost:5006/health" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 API Documentation:" -ForegroundColor Cyan
Write-Host "   See microservices\README.md for detailed API documentation" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are responding
Write-Host "🔍 Checking service health..." -ForegroundColor Cyan
$services = @(
    @{Port=5001; Name="Order"},
    @{Port=5002; Name="Payment"},
    @{Port=5003; Name="Notification"},
    @{Port=5004; Name="Delivery"},
    @{Port=5006; Name="Restaurant"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) Service (port $($service.Port)) - Healthy" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($service.Name) Service (port $($service.Port)) - Not responding" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  $($service.Name) Service (port $($service.Port)) - Not responding" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎯 Ready to test! Try creating an order:" -ForegroundColor Green
Write-Host "curl -X POST http://localhost:5001/api/orders \" -ForegroundColor Gray
Write-Host "  -H \"Content-Type: application/json\" \" -ForegroundColor Gray
Write-Host "  -d '{\"restaurantId\": \"rest-001\", \"items\": [{\"itemId\": \"item-001\", \"quantity\": 1, \"price\": 12.99}], \"userId\": \"user-123\", \"deliveryAddress\": \"123 Main St\"}'" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
Read-Host
