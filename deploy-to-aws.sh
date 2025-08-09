#!/bin/bash

# AWS Deployment Script for SIS + Ed-Fi ODS
# This script deploys the entire stack to AWS ECS or EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REGISTRY=${ECR_REGISTRY:-}
STACK_NAME=${STACK_NAME:-sis-edfi-stack}
DEPLOYMENT_TYPE=${1:-ec2} # ec2 or ecs

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SIS + Ed-Fi ODS AWS Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}AWS credentials not configured. Please run 'aws configure'.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Build and push Docker images to ECR
push_to_ecr() {
    echo -e "${YELLOW}Building and pushing Docker images to ECR...${NC}"
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
    
    # Build and push SIS Backend
    echo -e "${YELLOW}Building SIS Backend...${NC}"
    docker build -t sis-backend ./sis-backend
    docker tag sis-backend:latest $ECR_REGISTRY/sis-backend:latest
    docker push $ECR_REGISTRY/sis-backend:latest
    
    # Build and push SIS Frontend
    echo -e "${YELLOW}Building SIS Frontend...${NC}"
    docker build -t sis-frontend ./sis-app
    docker tag sis-frontend:latest $ECR_REGISTRY/sis-frontend:latest
    docker push $ECR_REGISTRY/sis-frontend:latest
    
    echo -e "${GREEN}✓ Images pushed to ECR${NC}"
}

# Deploy to EC2
deploy_to_ec2() {
    echo -e "${YELLOW}Deploying to EC2...${NC}"
    
    # Create security group if it doesn't exist
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=$STACK_NAME-sg" \
        --query "SecurityGroups[0].GroupId" \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$SECURITY_GROUP_ID" ] || [ "$SECURITY_GROUP_ID" == "None" ]; then
        echo -e "${YELLOW}Creating security group...${NC}"
        SECURITY_GROUP_ID=$(aws ec2 create-security-group \
            --group-name "$STACK_NAME-sg" \
            --description "Security group for SIS + Ed-Fi stack" \
            --query 'GroupId' \
            --output text)
        
        # Allow HTTP, HTTPS, and SSH
        aws ec2 authorize-security-group-ingress \
            --group-id $SECURITY_GROUP_ID \
            --protocol tcp --port 80 --cidr 0.0.0.0/0
        
        aws ec2 authorize-security-group-ingress \
            --group-id $SECURITY_GROUP_ID \
            --protocol tcp --port 443 --cidr 0.0.0.0/0
        
        aws ec2 authorize-security-group-ingress \
            --group-id $SECURITY_GROUP_ID \
            --protocol tcp --port 22 --cidr 0.0.0.0/0
    fi
    
    # Get latest Amazon Linux 2 AMI
    AMI_ID=$(aws ec2 describe-images \
        --owners amazon \
        --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
        --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
        --output text)
    
    # Create EC2 instance
    echo -e "${YELLOW}Launching EC2 instance...${NC}"
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id $AMI_ID \
        --instance-type t3.xlarge \
        --security-group-ids $SECURITY_GROUP_ID \
        --key-name ${KEY_NAME:-my-key} \
        --user-data file://ec2-user-data.sh \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$STACK_NAME}]" \
        --query 'Instances[0].InstanceId' \
        --output text)
    
    echo -e "${GREEN}✓ EC2 instance launched: $INSTANCE_ID${NC}"
    
    # Wait for instance to be running
    echo -e "${YELLOW}Waiting for instance to be ready...${NC}"
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    
    echo -e "${GREEN}✓ Instance is ready!${NC}"
    echo -e "${GREEN}Public IP: $PUBLIC_IP${NC}"
    echo -e "${GREEN}Access your application at: http://$PUBLIC_IP${NC}"
}

# Deploy to ECS
deploy_to_ecs() {
    echo -e "${YELLOW}Deploying to ECS with Fargate...${NC}"
    
    # Create ECS cluster
    aws ecs create-cluster --cluster-name $STACK_NAME-cluster --region $AWS_REGION || true
    
    # Register task definition
    aws ecs register-task-definition \
        --cli-input-json file://ecs-task-definition.json \
        --region $AWS_REGION
    
    # Create ECS service
    aws ecs create-service \
        --cluster $STACK_NAME-cluster \
        --service-name $STACK_NAME-service \
        --task-definition $STACK_NAME-task \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
        --region $AWS_REGION
    
    echo -e "${GREEN}✓ ECS service created${NC}"
}

# Main deployment flow
main() {
    check_prerequisites
    
    # Copy environment file
    if [ ! -f .env.production ]; then
        echo -e "${YELLOW}Creating .env.production from example...${NC}"
        cp .env.production.example .env.production
        echo -e "${RED}Please edit .env.production with your actual values before continuing.${NC}"
        exit 1
    fi
    
    # Load environment variables
    source .env.production
    
    # Push images to ECR if registry is configured
    if [ ! -z "$ECR_REGISTRY" ]; then
        push_to_ecr
    fi
    
    # Deploy based on type
    if [ "$DEPLOYMENT_TYPE" == "ec2" ]; then
        deploy_to_ec2
    elif [ "$DEPLOYMENT_TYPE" == "ecs" ]; then
        deploy_to_ecs
    else
        echo -e "${RED}Invalid deployment type. Use 'ec2' or 'ecs'.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Run main function
main