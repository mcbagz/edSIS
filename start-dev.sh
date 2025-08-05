#!/bin/bash

echo "Starting SIS Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start PostgreSQL with Docker
echo "Starting PostgreSQL database..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is ready
until docker exec sis-postgres-dev pg_isready -U postgres > /dev/null 2>&1; do
    echo "Waiting for database..."
    sleep 2
done

echo "PostgreSQL is ready!"

# Run migrations and seed
echo "Setting up database..."
cd sis-backend
npm run prisma:generate
npm run prisma:migrate deploy
npm run prisma:seed

echo ""
echo "Development environment is ready!"
echo ""
echo "PostgreSQL is running at: localhost:5432"
echo "PgAdmin is available at: http://localhost:5050"
echo "  Email: admin@school.edu"
echo "  Password: admin123"
echo ""
echo "To start the backend server:"
echo "  cd sis-backend && npm run dev"
echo ""
echo "To start the frontend:"
echo "  cd sis-app && npm run dev"
echo ""
echo "To stop PostgreSQL:"
echo "  docker-compose -f docker-compose.dev.yml down"
echo ""