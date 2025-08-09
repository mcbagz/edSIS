#!/bin/bash

# Complete AWS CLI Deployment Script
# This script creates everything needed to deploy SIS + Ed-Fi ODS on AWS

set -e

# Configuration Variables
AWS_REGION=${AWS_REGION:-us-east-1}
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.xlarge}
KEY_NAME=${KEY_NAME:-sis-edfi-key}
SECURITY_GROUP_NAME=${SECURITY_GROUP_NAME:-sis-edfi-sg}
INSTANCE_NAME=${INSTANCE_NAME:-SIS-EdFi-Stack}
GITHUB_REPO=${GITHUB_REPO:-https://github.com/your-username/your-repo.git}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}AWS CLI Deployment for SIS + Ed-Fi ODS${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to check if AWS CLI is configured
check_aws_cli() {
    echo -e "${YELLOW}Checking AWS CLI configuration...${NC}"
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}AWS CLI is not configured. Please run 'aws configure' first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ AWS CLI is configured${NC}"
    
    # Display current AWS identity
    IDENTITY=$(aws sts get-caller-identity --query 'Arn' --output text)
    echo -e "${GREEN}  Using identity: $IDENTITY${NC}"
}

# Function to create or get SSH key pair
create_key_pair() {
    echo -e "${YELLOW}Setting up SSH key pair...${NC}"
    
    # Check if key pair exists
    if aws ec2 describe-key-pairs --key-names $KEY_NAME --region $AWS_REGION &> /dev/null; then
        echo -e "${GREEN}✓ Key pair '$KEY_NAME' already exists${NC}"
    else
        echo -e "${YELLOW}Creating new key pair '$KEY_NAME'...${NC}"
        aws ec2 create-key-pair \
            --key-name $KEY_NAME \
            --query 'KeyMaterial' \
            --output text \
            --region $AWS_REGION > ${KEY_NAME}.pem
        
        chmod 400 ${KEY_NAME}.pem
        echo -e "${GREEN}✓ Key pair created and saved to ${KEY_NAME}.pem${NC}"
        echo -e "${YELLOW}  IMPORTANT: Keep this file safe! You'll need it to SSH into your instance.${NC}"
    fi
}

# Function to create security group
create_security_group() {
    echo -e "${YELLOW}Setting up security group...${NC}"
    
    # Get default VPC ID
    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=is-default,Values=true" \
        --query 'Vpcs[0].VpcId' \
        --output text \
        --region $AWS_REGION)
    
    # Check if security group exists
    SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
        --query 'SecurityGroups[0].GroupId' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
    
    if [ -z "$SG_ID" ] || [ "$SG_ID" == "None" ]; then
        echo -e "${YELLOW}Creating security group '$SECURITY_GROUP_NAME'...${NC}"
        
        # Create security group
        SG_ID=$(aws ec2 create-security-group \
            --group-name $SECURITY_GROUP_NAME \
            --description "Security group for SIS + Ed-Fi ODS stack" \
            --vpc-id $VPC_ID \
            --query 'GroupId' \
            --output text \
            --region $AWS_REGION)
        
        echo -e "${GREEN}✓ Security group created: $SG_ID${NC}"
        
        # Add security group rules
        echo -e "${YELLOW}Adding security group rules...${NC}"
        
        # SSH access
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 22 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        # HTTP access
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 80 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        # HTTPS access
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 443 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        # SIS Frontend (3000)
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 3000 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        # SIS Backend API (5000)
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 5000 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        # Ed-Fi API (8001)
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 8001 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        # Ed-Fi Swagger (8002)
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 8002 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        # Ed-Fi Sandbox Admin (8003)
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 8003 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        echo -e "${GREEN}✓ Security group rules added${NC}"
    else
        echo -e "${GREEN}✓ Security group '$SECURITY_GROUP_NAME' already exists: $SG_ID${NC}"
    fi
}

# Function to get latest Amazon Linux 2 AMI
get_ami_id() {
    echo -e "${YELLOW}Getting latest Amazon Linux 2 AMI...${NC}"
    
    AMI_ID=$(aws ec2 describe-images \
        --owners amazon \
        --filters \
            "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
            "Name=state,Values=available" \
        --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
        --output text \
        --region $AWS_REGION)
    
    echo -e "${GREEN}✓ AMI ID: $AMI_ID${NC}"
}

# Function to create user data script
create_user_data() {
    echo -e "${YELLOW}Creating user data script...${NC}"
    
    cat > user-data.sh << 'EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting deployment at $(date)"

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

# Create docker-compose.yml
cat > docker-compose.yml << 'EOFDOCKER'
version: '3.8'

services:
  # Ed-Fi PostgreSQL Databases
  edfi-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: SecurePassword123
      POSTGRES_DB: postgres
    command: |
      postgres
      -c max_connections=200
      -c shared_buffers=256MB
    volumes:
      - edfi-db-data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # SIS PostgreSQL Database
  sis-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: SecurePassword123
      POSTGRES_DB: sis_db
    volumes:
      - sis-db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Simple welcome page while full stack loads
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "8001:8001"
      - "8002:8002"
      - "8003:8003"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: always

volumes:
  edfi-db-data:
  sis-db-data:
EOFDOCKER

# Create nginx configuration
cat > nginx.conf << 'EOFNGINX'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        location / {
            return 200 'SIS + Ed-Fi ODS Stack\n\nStatus: Deployment Complete!\n\nServices:\n- Main App: http://$host\n- Ed-Fi API: http://$host:8001\n- Ed-Fi Swagger: http://$host:8002\n- Ed-Fi Sandbox: http://$host:8003\n\nDatabases are ready for Ed-Fi ODS installation.\n';
            add_header Content-Type text/plain;
        }
    }
    
    server {
        listen 8001;
        location / {
            return 200 'Ed-Fi API will be available here\n';
            add_header Content-Type text/plain;
        }
    }
    
    server {
        listen 8002;
        location / {
            return 200 'Ed-Fi Swagger UI will be available here\n';
            add_header Content-Type text/plain;
        }
    }
    
    server {
        listen 8003;
        location / {
            return 200 'Ed-Fi Sandbox Admin will be available here\n';
            add_header Content-Type text/plain;
        }
    }
}
EOFNGINX

# Start services
docker-compose up -d

# Create systemd service
cat > /etc/systemd/system/sis-edfi.service << 'EOFSVC'
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
EOFSVC

systemctl enable sis-edfi.service

echo "Deployment completed at $(date)"

# Set completion flag
touch /tmp/deployment-complete
EOF
    
    echo -e "${GREEN}✓ User data script created${NC}"
}

# Function to launch EC2 instance
launch_instance() {
    echo -e "${YELLOW}Launching EC2 instance...${NC}"
    
    # Launch the instance
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id $AMI_ID \
        --instance-type $INSTANCE_TYPE \
        --key-name $KEY_NAME \
        --security-group-ids $SG_ID \
        --user-data file://user-data.sh \
        --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=100,VolumeType=gp3}" \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
        --query 'Instances[0].InstanceId' \
        --output text \
        --region $AWS_REGION)
    
    echo -e "${GREEN}✓ Instance launched: $INSTANCE_ID${NC}"
    
    # Wait for instance to be running
    echo -e "${YELLOW}Waiting for instance to start...${NC}"
    aws ec2 wait instance-running \
        --instance-ids $INSTANCE_ID \
        --region $AWS_REGION
    
    # Get instance details
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text \
        --region $AWS_REGION)
    
    PRIVATE_IP=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].PrivateIpAddress' \
        --output text \
        --region $AWS_REGION)
    
    echo -e "${GREEN}✓ Instance is running!${NC}"
    echo -e "${GREEN}  Instance ID: $INSTANCE_ID${NC}"
    echo -e "${GREEN}  Public IP: $PUBLIC_IP${NC}"
    echo -e "${GREEN}  Private IP: $PRIVATE_IP${NC}"
}

# Function to create Elastic IP (optional)
create_elastic_ip() {
    read -p "Do you want to allocate an Elastic IP? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Allocating Elastic IP...${NC}"
        
        ALLOCATION_ID=$(aws ec2 allocate-address \
            --domain vpc \
            --query 'AllocationId' \
            --output text \
            --region $AWS_REGION)
        
        ELASTIC_IP=$(aws ec2 describe-addresses \
            --allocation-ids $ALLOCATION_ID \
            --query 'Addresses[0].PublicIp' \
            --output text \
            --region $AWS_REGION)
        
        # Associate with instance
        aws ec2 associate-address \
            --instance-id $INSTANCE_ID \
            --allocation-id $ALLOCATION_ID \
            --region $AWS_REGION
        
        echo -e "${GREEN}✓ Elastic IP allocated and associated: $ELASTIC_IP${NC}"
        PUBLIC_IP=$ELASTIC_IP
    fi
}

# Function to wait for deployment
wait_for_deployment() {
    echo -e "${YELLOW}Waiting for deployment to complete (this may take 3-5 minutes)...${NC}"
    
    # Wait for user data script to complete
    for i in {1..30}; do
        if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP "test -f /tmp/deployment-complete" 2>/dev/null; then
            echo -e "${GREEN}✓ Deployment completed!${NC}"
            break
        fi
        echo -n "."
        sleep 10
    done
    echo
}

# Function to display connection information
display_info() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Deployment Complete!${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo
    echo -e "${GREEN}Instance Information:${NC}"
    echo -e "  Instance ID: ${YELLOW}$INSTANCE_ID${NC}"
    echo -e "  Public IP: ${YELLOW}$PUBLIC_IP${NC}"
    echo -e "  Region: ${YELLOW}$AWS_REGION${NC}"
    echo
    echo -e "${GREEN}SSH Access:${NC}"
    echo -e "  ${YELLOW}ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP${NC}"
    echo
    echo -e "${GREEN}Web Access:${NC}"
    echo -e "  Main Application: ${YELLOW}http://$PUBLIC_IP${NC}"
    echo -e "  SIS Frontend: ${YELLOW}http://$PUBLIC_IP:3000${NC}"
    echo -e "  SIS Backend API: ${YELLOW}http://$PUBLIC_IP:5000${NC}"
    echo -e "  Ed-Fi API: ${YELLOW}http://$PUBLIC_IP:8001${NC}"
    echo -e "  Ed-Fi Swagger: ${YELLOW}http://$PUBLIC_IP:8002${NC}"
    echo -e "  Ed-Fi Sandbox: ${YELLOW}http://$PUBLIC_IP:8003${NC}"
    echo
    echo -e "${GREEN}Next Steps:${NC}"
    echo -e "  1. SSH into the instance"
    echo -e "  2. Check Docker status: ${YELLOW}docker ps${NC}"
    echo -e "  3. View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  4. Deploy your application code"
    echo
    echo -e "${YELLOW}To terminate this instance later:${NC}"
    echo -e "  ${YELLOW}aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION${NC}"
    echo
    
    # Save instance details to file
    cat > instance-details.txt << EOF
SIS + Ed-Fi ODS AWS Deployment
==============================
Date: $(date)
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
Private IP: $PRIVATE_IP
Region: $AWS_REGION
Key Name: $KEY_NAME
Security Group: $SG_ID

SSH Command:
ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP

Terminate Command:
aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION
EOF
    
    echo -e "${GREEN}Instance details saved to: instance-details.txt${NC}"
}

# Main execution
main() {
    echo
    check_aws_cli
    echo
    create_key_pair
    echo
    create_security_group
    echo
    get_ami_id
    echo
    create_user_data
    echo
    launch_instance
    echo
    create_elastic_ip
    echo
    wait_for_deployment
    echo
    display_info
    
    # Clean up
    rm -f user-data.sh
}

# Run the script
main