#!/bin/bash

# EC2 User Data Script for SIS + Ed-Fi ODS Deployment
# This script runs automatically when the EC2 instance starts

# Update system
yum update -y

# Install Docker
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user
chkconfig docker on

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Install Git
yum install git -y

# Create application directory
mkdir -p /opt/sis-edfi
cd /opt/sis-edfi

# Clone repository (replace with your repo URL)
# git clone https://github.com/your-username/your-repo.git .

# For now, create necessary files
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # SIS PostgreSQL Database
  sis-postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 980jlej.23kd
      POSTGRES_DB: sis_db
    volumes:
      - sis-postgres-data:/var/lib/postgresql/data
    networks:
      - sis-network
    restart: always

  # Ed-Fi ODS Database
  edfi-db-ods:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES_DEFAULT: postgres
      DATABASES_HOST: edfi-db-ods-internal
      DATABASES_PORT: 5432
      DATABASES_USER: postgres
      DATABASES_PASSWORD: 980jlej.23kd
    networks:
      - sis-network
    restart: always

  edfi-db-ods-internal:
    image: edfialliance/ods-api-db-ods:v7.1-postgresql
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 980jlej.23kd
      POSTGRES_DB: postgres
      TPDM_ENABLED: "true"
    volumes:
      - edfi-db-ods-data:/var/lib/postgresql/data
    networks:
      - sis-network
    restart: always

  # Ed-Fi Admin Database
  edfi-db-admin:
    image: edfialliance/ods-api-db-admin:v7.1-postgresql
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 980jlej.23kd
      POSTGRES_DB: postgres
    volumes:
      - edfi-db-admin-data:/var/lib/postgresql/data
    networks:
      - sis-network
    restart: always

  # Ed-Fi API
  edfi-api:
    image: edfialliance/ods-api-web-api:v7.1-postgresql
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 980jlej.23kd
      POSTGRES_PORT: 5432
      ODS_POSTGRES_HOST: edfi-db-ods
      ADMIN_POSTGRES_HOST: edfi-db-admin
      PATH_BASE: ""
      TPDM_ENABLED: "true"
      NPG_POOLING_ENABLED: "false"
      ODS_CONNECTION_STRING_ENCRYPTION_KEY: "+MkpJfdOoBs2W+UCibqwMcjAF5rUUk6AxPiOAIFNEWQ="
    depends_on:
      - edfi-db-ods
      - edfi-db-admin
    networks:
      - sis-network
    restart: always

  # Ed-Fi Swagger UI
  edfi-swagger:
    image: edfialliance/ods-api-swaggerui:v7.1
    environment:
      SAMPLE_KEY: populatedKey
      SAMPLE_SECRET: populatedSecret
      VERSION_URL: http://edfi-api
    depends_on:
      - edfi-api
    networks:
      - sis-network
    restart: always

  # Ed-Fi Sandbox Admin
  edfi-sandbox:
    image: edfialliance/ods-api-web-sandbox-admin:v7.1-postgresql
    environment:
      PATH_BASE: sandbox
      OAUTH_URL: http://edfi-api/oauth/
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 980jlej.23kd
      POSTGRES_PORT: 5432
      ODS_POSTGRES_HOST: edfi-db-ods
      ADMIN_POSTGRES_HOST: edfi-db-admin
      NPG_POOLING_ENABLED: "false"
      ADMIN_USER: test@ed-fi.org
      ADMIN_PASSWORD: y79mwc5hWb6K0gIlCDPvf
      MINIMAL_KEY: minimalKey
      MINIMAL_SECRET: minimalSecret
      POPULATED_KEY: populatedKey
      POPULATED_SECRET: populatedSecret
    depends_on:
      - edfi-api
    networks:
      - sis-network
    restart: always

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - edfi-api
      - edfi-swagger
      - edfi-sandbox
    networks:
      - sis-network
    restart: always

networks:
  sis-network:
    driver: bridge

volumes:
  sis-postgres-data:
  edfi-db-ods-data:
  edfi-db-admin-data:
EOF

# Create nginx configuration
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        
        location / {
            return 200 "SIS + Ed-Fi ODS is running!\n\nEndpoints:\n- Ed-Fi API: /edfi\n- Ed-Fi Swagger: /edfi-swagger\n- Ed-Fi Sandbox: /edfi-sandbox\n";
            add_header Content-Type text/plain;
        }
        
        location /edfi/ {
            proxy_pass http://edfi-api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /edfi-swagger/ {
            proxy_pass http://edfi-swagger/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /edfi-sandbox/ {
            proxy_pass http://edfi-sandbox/;
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

# Start Docker Compose
docker-compose up -d

# Create systemd service for auto-start
cat > /etc/systemd/system/sis-edfi.service << 'EOF'
[Unit]
Description=SIS Ed-Fi Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/sis-edfi
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl enable sis-edfi.service
systemctl start sis-edfi.service

# Install CloudWatch agent (optional)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

echo "Deployment complete!"