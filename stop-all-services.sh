#!/bin/bash

# Food Ordering Microservices - Stop Script
# This script stops all running microservices

echo "🛑 Stopping Food Ordering Microservices System"
echo "=============================================="

# Check if PID file exists
if [ ! -f "/tmp/microservices.pids" ]; then
    echo "⚠️  No PID file found. Services may not be running."
    exit 1
fi

# Read PIDs and stop services
echo "🔍 Stopping services..."
while read pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo "🛑 Stopping service with PID: $pid"
        kill "$pid"
    fi
done < /tmp/microservices.pids

# Clean up PID file
rm -f /tmp/microservices.pids

echo "✅ All services stopped"
echo ""
echo "🐳 Kafka is still running. To stop Kafka:"
echo "   docker-compose down"
echo ""
echo "🧹 To clean up everything (including Kafka):"
echo "   docker-compose down -v"
