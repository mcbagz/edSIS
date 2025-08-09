#!/bin/bash

# Ultra-simple AWS deployment script - just run this!
# Usage: ./aws-quick-deploy.sh

set -e

echo "🚀 Quick AWS Deployment for SIS + Ed-Fi ODS"
echo "==========================================="

# Check AWS CLI
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run: aws configure"
    exit 1
fi

# Variables
REGION=${AWS_REGION:-us-east-1}
KEY_NAME="sis-edfi-$(date +%s)"
SG_NAME="sis-edfi-sg-$(date +%s)"

echo "📍 Region: $REGION"

# Create key pair
echo "🔑 Creating SSH key..."
aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
chmod 400 ${KEY_NAME}.pem

# Get VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)

# Create security group with all ports open
echo "🔒 Creating security group..."
SG_ID=$(aws ec2 create-security-group \
    --group-name $SG_NAME \
    --description "SIS EdFi Stack" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

# Open all required ports in one command
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --ip-permissions \
        IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=3000,ToPort=3000,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=5000,ToPort=5000,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=8001,ToPort=8003,IpRanges='[{CidrIp=0.0.0.0/0}]'

# Get AMI
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text)

# Launch instance with inline user data
echo "🖥️  Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type t3.xlarge \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=100,VolumeType=gp3}" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=SIS-EdFi-QuickDeploy}]" \
    --user-data '#!/bin/bash
yum update -y
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user
curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
yum install git -y
mkdir -p /opt/app && cd /opt/app
# Create welcome page
cat > docker-compose.yml << EOF
version: "3.8"
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    command: |
      sh -c "echo \"<h1>SIS + Ed-Fi Stack Ready!</h1>
      <p>Instance is ready for deployment.</p>
      <p>SSH in and deploy your application.</p>
      <ul>
        <li>Port 3000: SIS Frontend</li>
        <li>Port 5000: SIS Backend</li>
        <li>Port 8001: Ed-Fi API</li>
        <li>Port 8002: Ed-Fi Swagger</li>
        <li>Port 8003: Ed-Fi Sandbox</li>
      </ul>\" > /usr/share/nginx/html/index.html && nginx -g \"daemon off;\""
    restart: always
EOF
docker-compose up -d' \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "⏳ Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

# Output results
echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "📋 Instance Details:"
echo "  ID: $INSTANCE_ID"
echo "  IP: $PUBLIC_IP"
echo "  Key: ${KEY_NAME}.pem"
echo ""
echo "🔗 Access:"
echo "  SSH: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo "  Web: http://$PUBLIC_IP"
echo ""
echo "📝 Next Steps:"
echo "  1. SSH into the instance"
echo "  2. Clone your repo: git clone [your-repo]"
echo "  3. Run: docker-compose -f docker-compose.all-in-one.yml up -d"
echo ""
echo "🗑️  To terminate:"
echo "  aws ec2 terminate-instances --instance-ids $INSTANCE_ID"
echo ""

# Save details
cat > deployment-info.txt << EOF
Deployment Info
===============
Date: $(date)
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
SSH Key: ${KEY_NAME}.pem
Region: $REGION

SSH Command:
ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP

Terminate Command:
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
EOF

echo "💾 Details saved to: deployment-info.txt"