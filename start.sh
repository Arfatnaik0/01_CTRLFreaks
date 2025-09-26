#!/bin/bash

# IoT Energy Monitor - Quick Start Script

echo "🚀 Starting IoT Smart Energy Monitoring System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cp .env.example .env
    echo "✅ Environment file created. You can modify .env if needed."
fi

# Build and start all services
echo "🐳 Starting all services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check Kafka
if curl -f http://localhost:9092 > /dev/null 2>&1; then
    echo "✅ Kafka is running"
else
    echo "⚠️  Kafka may still be starting up"
fi

# Check PostgreSQL
if docker-compose exec postgres pg_isready -U iot_user > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL may still be starting up"
fi

# Check Flask API
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Flask API is running"
else
    echo "⚠️  Flask API may still be starting up"
fi

echo ""
echo "🎉 System is starting up! Access points:"
echo "   • Flask API: http://localhost:5000"
echo "   • Grafana Dashboard: http://localhost:3001 (admin/admin)"
echo "   • Frontend: http://localhost:3000 (when started)"
echo ""
echo "📊 Check logs: docker-compose logs -f [service-name]"
echo "🛑 Stop system: docker-compose down"
echo ""
echo "Next steps:"
echo "1. Start the frontend: cd frontend && npm run dev"
echo "2. Check API health: curl http://localhost:5000/api/health"
echo "3. View sensor data: curl http://localhost:5000/api/devices"