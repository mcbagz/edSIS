#!/bin/bash

# Simple script to start the entire SIS + Ed-Fi stack locally or on AWS

echo "======================================"
echo "Starting SIS + Ed-Fi ODS Stack"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
mkdir -p logs

# Check if we're using the all-in-one or separate compose files
if [ -f "docker-compose.all-in-one.yml" ]; then
    echo "Using all-in-one configuration..."
    COMPOSE_FILE="docker-compose.all-in-one.yml"
else
    echo "Using production configuration..."
    COMPOSE_FILE="docker-compose.production.yml"
fi

# Pull latest images (optional)
echo "Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull

# Build custom images
echo "Building custom images..."
docker-compose -f $COMPOSE_FILE build

# Start all services
echo "Starting all services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Check service status
echo ""
echo "======================================"
echo "Service Status:"
echo "======================================"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "======================================"
echo "Stack is starting up!"
echo "======================================"
echo ""
echo "Access points:"
echo "- Main Application: http://localhost"
echo "- SIS Frontend: http://localhost:3000"
echo "- SIS Backend API: http://localhost:5000"
echo "- Ed-Fi API: http://localhost:8001"
echo "- Ed-Fi Swagger: http://localhost:8002"
echo "- Ed-Fi Sandbox Admin: http://localhost:8003"
echo ""
echo "Default Credentials:"
echo "- SIS Admin: admin@school.edu / Admin123!"
echo "- Ed-Fi Sandbox: admin@school.edu / AdminPass123!"
echo "- Ed-Fi API Key: populatedKey"
echo "- Ed-Fi API Secret: populatedSecret"
echo ""
echo "To view logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "To stop: docker-compose -f $COMPOSE_FILE down"
echo ""