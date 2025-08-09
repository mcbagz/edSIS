#!/bin/bash

# Setup script for EC2 instance
# Run this after cloning the repository

echo "Setting up SIS + Ed-Fi ODS on EC2..."

# Get the public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Public IP: $PUBLIC_IP"

# Create simple nginx.conf
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream sis_backend {
        server sis-backend:5000;
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://sis-frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /api/ {
            proxy_pass http://sis_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /health {
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Update the frontend build arg with actual public IP
sed -i "s/3.81.79.72/$PUBLIC_IP/g" docker-compose.aws-simple.yml

# Pull the official Ed-Fi images first
echo "Pulling Ed-Fi Docker images..."
docker pull edfialliance/ods-api-web-api:v7.1
docker pull edfialliance/ods-api-swaggerui:v7.1
docker pull edfialliance/ods-api-web-sandbox-admin:v7.1

# Start everything
echo "Starting all services..."
docker-compose -f docker-compose.aws-simple.yml up -d --build

# Wait for services to be ready
echo "Waiting for services to start (this may take 2-3 minutes)..."
sleep 30

# Check status
docker-compose -f docker-compose.aws-simple.yml ps

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Access your services at:"
echo "  Main App: http://$PUBLIC_IP"
echo "  SIS Frontend: http://$PUBLIC_IP:3000"
echo "  SIS Backend API: http://$PUBLIC_IP:5000"
echo "  Ed-Fi API: http://$PUBLIC_IP:8001"
echo "  Ed-Fi Swagger: http://$PUBLIC_IP:8002"
echo "  Ed-Fi Sandbox: http://$PUBLIC_IP:8003"
echo ""
echo "Default Credentials:"
echo "  Ed-Fi Sandbox: test@ed-fi.org / y79mwc5hWb6K0gIlCDPvf"
echo "  Ed-Fi API: populatedKey / populatedSecret"
echo ""
echo "To view logs: docker-compose -f docker-compose.aws-simple.yml logs -f"
echo "To stop: docker-compose -f docker-compose.aws-simple.yml down"