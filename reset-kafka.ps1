# Reset Kafka - Clears all topics and data
Write-Host "🔄 Resetting Kafka..." -ForegroundColor Yellow

# Stop services
Write-Host "Stopping services..." -ForegroundColor Cyan
docker-compose down

# Remove Kafka volumes to clear all data
Write-Host "Removing Kafka volumes..." -ForegroundColor Cyan
docker volume rm microservices_kafka-data -ErrorAction SilentlyContinue

# Start only Kafka and topic creator
Write-Host "Starting Kafka and creating topics..." -ForegroundColor Green
docker-compose up -d kafka
Start-Sleep -Seconds 5
docker-compose up kafka-topics

# Check if topics were created
Write-Host "`n✅ Kafka reset complete! Topics created:" -ForegroundColor Green
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092

Write-Host "`nYou can now start your services:" -ForegroundColor Yellow
Write-Host "  docker-compose up postgres -d" -ForegroundColor Cyan
Write-Host "  npm start (in each service directory)" -ForegroundColor Cyan

