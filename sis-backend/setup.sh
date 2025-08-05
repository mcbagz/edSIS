#!/bin/bash

echo "Setting up SIS Backend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed."
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please update the .env file with your database credentials!"
    echo "Default PostgreSQL connection string: postgresql://postgres:postgres@localhost:5432/sis_db"
    echo ""
fi

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
npm run prisma:generate

# Ask user if they want to run migrations
echo ""
read -p "Do you want to run database migrations? (y/n): " runMigrations
if [[ $runMigrations =~ ^[Yy]$ ]]; then
    echo "Running migrations..."
    npm run prisma:migrate
fi

# Ask user if they want to seed the database
echo ""
read -p "Do you want to seed the database with sample data? (y/n): " seedDatabase
if [[ $seedDatabase =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    npm run prisma:seed
fi

echo ""
echo "Setup complete!"
echo ""
echo "Sample login credentials:"
echo "  Admin: admin@school.edu / admin123"
echo "  Teacher: teacher@school.edu / teacher123"
echo "  Parent: parent@school.edu / parent123"
echo "  Student: student@school.edu / student123"
echo ""
echo "To start the server, run: npm run dev"
echo ""