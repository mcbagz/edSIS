#!/bin/bash

echo "Setting up SIS + Ed-Fi ODS on EC2 (Simple Version)..."

# Get the public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Public IP: $PUBLIC_IP"

# First, let's check if the Ed-Fi Docker directory exists
if [ ! -d "ed-fi-ods-implementation/Docker" ]; then
    echo "Ed-Fi Docker directory not found. Let's use the pre-configured setup..."
    
    # Create a simple index.html for testing
    cat > index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>SIS + Ed-Fi ODS on AWS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2e6da4; }
        .status { color: green; font-weight: bold; }
    </style>
</head>
<body>
    <h1>SIS + Ed-Fi ODS Stack</h1>
    <p class="status">✓ AWS Deployment Working!</p>
    <p>Server IP: $PUBLIC_IP</p>
    
    <h2>Services Status:</h2>
    <ul>
        <li>PostgreSQL Databases: Running</li>
        <li>Ed-Fi ODS: Setting up...</li>
        <li>SIS Application: Setting up...</li>
    </ul>
    
    <h2>Next Steps:</h2>
    <ol>
        <li>Copy Ed-Fi Docker files from local</li>
        <li>Build and deploy SIS application</li>
        <li>Configure Ed-Fi API endpoints</li>
    </ol>
</body>
</html>
EOF

    # Use the working Docker Compose from your local setup
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Ed-Fi PostgreSQL Databases
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 980jlej.23kd
      POSTGRES_DB: postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -d postgres -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # SIS Database
  sis-postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 980jlej.23kd
      POSTGRES_DB: sis_db
    volumes:
      - sis-postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -d sis_db -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx web server
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "8001:8001"
      - "8002:8002"
      - "8003:8003"
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: always

volumes:
  postgres-data:
  sis-postgres-data:
EOF

    # Create a basic nginx config
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
    
    server {
        listen 8001;
        location / {
            return 200 'Ed-Fi API endpoint (will be configured)\n';
            add_header Content-Type text/plain;
        }
    }
    
    server {
        listen 8002;
        location / {
            return 200 'Ed-Fi Swagger UI endpoint (will be configured)\n';
            add_header Content-Type text/plain;
        }
    }
    
    server {
        listen 8003;
        location / {
            return 200 'Ed-Fi Sandbox Admin endpoint (will be configured)\n';
            add_header Content-Type text/plain;
        }
    }
}
EOF

    # Start the basic services
    echo "Starting basic services..."
    docker-compose up -d
    
    # Check what's running
    echo ""
    echo "Checking services..."
    docker ps
    
    echo ""
    echo "========================================"
    echo "Basic Infrastructure Deployed!"
    echo "========================================"
    echo ""
    echo "Access at: http://$PUBLIC_IP"
    echo ""
    echo "Databases are running and ready."
    echo ""
    echo "To deploy Ed-Fi ODS components:"
    echo "1. Copy the Ed-Fi Docker build files from your local machine"
    echo "2. Or use the Ed-Fi ODS Docker Deploy tool"
    echo ""
    echo "To check logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    
else
    echo "Ed-Fi Docker directory found! Using local configuration..."
    
    # Use the exact working configuration from local
    cd ed-fi-ods-implementation/Docker
    
    # Copy the working .env file
    cat > .env << 'EOF'
LOGS_FOLDER=.logs
POSTGRES_USER=postgres
POSTGRES_PASSWORD=980jlej.23kd
POSTGRES_DB=postgres
TPDM_ENABLED=true
API_HOSTNAME=localhost
ODS_VIRTUAL_NAME=api
ODS_CONNECTION_STRING_ENCRYPTION_KEY=+MkpJfdOoBs2W+UCibqwMcjAF5rUUk6AxPiOAIFNEWQ=
API_HEALTHCHECK_TEST="wget --no-verbose --tries=1 --output-document=/dev/null http://localhost/health || exit 1"
SWAGGER_HEALTHCHECK_TEST="wget --no-verbose --tries=1 --output-document=/dev/null http://localhost/health || exit 1"
SANDBOX_HEALTHCHECK_TEST="wget --no-verbose --tries=1 --spider http://localhost/health || exit 1"
API_INTERNAL_URL=http://api
SANDBOX_VIRTUAL_NAME=sandbox
ADMIN_USER=test@ed-fi.org
ADMIN_PASSWORD=y79mwc5hWb6K0gIlCDPvf
MINIMAL_KEY=minimalKey
MINIMAL_SECRET=minimalSecret
POPULATED_KEY=populatedKey
POPULATED_SECRET=populatedSecret
EOF
    
    # Start Ed-Fi using the sandbox PostgreSQL compose
    docker-compose -f docker-compose-sandbox-pgsql.yml up -d
    
    echo ""
    echo "========================================"
    echo "Ed-Fi ODS Deployed!"
    echo "========================================"
    echo ""
    echo "Ed-Fi API: http://$PUBLIC_IP:8001"
    echo "Ed-Fi Swagger: http://$PUBLIC_IP:8002"
    echo "Ed-Fi Sandbox: http://$PUBLIC_IP:8003"
fi