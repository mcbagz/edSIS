# 🚀 AWS CLI Deployment Guide

Deploy your entire SIS + Ed-Fi ODS stack to AWS using just the command line!

## Prerequisites

1. **AWS CLI installed and configured:**
   ```bash
   # Install AWS CLI (if not already installed)
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure AWS CLI
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter default region (e.g., us-east-1)
   # Enter default output format (json)
   ```

2. **Verify AWS CLI is working:**
   ```bash
   aws sts get-caller-identity
   ```

## 🎯 Quick Deploy (One Command!)

### Option 1: Super Quick Deploy (Recommended)
```bash
# Download and run the quick deploy script
curl -O https://raw.githubusercontent.com/your-repo/aws-quick-deploy.sh
chmod +x aws-quick-deploy.sh
./aws-quick-deploy.sh
```

**That's it!** Your EC2 instance will be ready in ~2 minutes.

### Option 2: Full Featured Deploy
```bash
# Download and run the full deployment script
curl -O https://raw.githubusercontent.com/your-repo/aws-deploy-cli.sh
chmod +x aws-deploy-cli.sh
./aws-deploy-cli.sh
```

### Option 3: PowerShell (Windows)
```powershell
# Download and run the PowerShell script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-repo/aws-deploy-cli.ps1" -OutFile "aws-deploy-cli.ps1"
.\aws-deploy-cli.ps1
```

## 📝 Manual CLI Deployment (Step by Step)

If you prefer to run commands manually:

### 1. Create SSH Key Pair
```bash
aws ec2 create-key-pair \
    --key-name sis-edfi-key \
    --query 'KeyMaterial' \
    --output text > sis-edfi-key.pem

chmod 400 sis-edfi-key.pem
```

### 2. Create Security Group
```bash
# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=is-default,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text)

# Create security group
SG_ID=$(aws ec2 create-security-group \
    --group-name sis-edfi-sg \
    --description "SIS EdFi Stack" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

# Add rules for all required ports
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --ip-permissions \
        IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=3000,ToPort=3000,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=5000,ToPort=5000,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=8001,ToPort=8003,IpRanges='[{CidrIp=0.0.0.0/0}]'
```

### 3. Launch EC2 Instance
```bash
# Get latest Amazon Linux 2 AMI
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text)

# Launch instance
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type t3.xlarge \
    --key-name sis-edfi-key \
    --security-group-ids $SG_ID \
    --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=100,VolumeType=gp3}" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=SIS-EdFi-Stack}]' \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Instance ID: $INSTANCE_ID"
```

### 4. Wait and Get IP
```bash
# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "Public IP: $PUBLIC_IP"
```

### 5. SSH and Deploy
```bash
# SSH into instance
ssh -i sis-edfi-key.pem ec2-user@$PUBLIC_IP

# Once connected, run these commands:
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Exit and reconnect for group changes
exit
ssh -i sis-edfi-key.pem ec2-user@$PUBLIC_IP

# Clone your repository
git clone [your-repo-url] sis-edfi
cd sis-edfi

# Start everything
docker-compose -f docker-compose.all-in-one.yml up -d
```

## 🔧 Useful AWS CLI Commands

### Check Instance Status
```bash
aws ec2 describe-instance-status --instance-ids $INSTANCE_ID
```

### Stop Instance (save money when not using)
```bash
aws ec2 stop-instances --instance-ids $INSTANCE_ID
```

### Start Instance
```bash
aws ec2 start-instances --instance-ids $INSTANCE_ID
```

### Terminate Instance (permanent deletion)
```bash
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
```

### List All Your Instances
```bash
aws ec2 describe-instances \
    --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress,Tags[?Key==`Name`]|[0].Value]' \
    --output table
```

### Create Elastic IP (optional - for permanent IP)
```bash
# Allocate Elastic IP
ALLOCATION_ID=$(aws ec2 allocate-address \
    --domain vpc \
    --query 'AllocationId' \
    --output text)

# Associate with instance
aws ec2 associate-address \
    --instance-id $INSTANCE_ID \
    --allocation-id $ALLOCATION_ID
```

## 💰 Cost Management

### Estimated Costs
- **t3.medium**: ~$0.042/hour (~$30/month)
- **t3.large**: ~$0.083/hour (~$60/month)
- **t3.xlarge**: ~$0.166/hour (~$120/month) - Recommended
- **Storage (100GB)**: ~$8/month

### Save Money Tips
1. **Stop instances when not in use:**
   ```bash
   aws ec2 stop-instances --instance-ids $INSTANCE_ID
   ```

2. **Use Spot Instances for testing (70% cheaper):**
   ```bash
   aws ec2 run-instances \
       --instance-market-options "MarketType=spot,SpotOptions={MaxPrice=0.05,SpotInstanceType=one-time}" \
       [other options...]
   ```

3. **Set up auto-stop with CloudWatch:**
   ```bash
   aws cloudwatch put-metric-alarm \
       --alarm-name "auto-stop-idle-instance" \
       --alarm-actions "arn:aws:automate:region:ec2:stop" \
       --metric-name CPUUtilization \
       --namespace AWS/EC2 \
       --statistic Average \
       --period 3600 \
       --threshold 5 \
       --comparison-operator LessThanThreshold \
       --evaluation-periods 2
   ```

## 🛡️ Security Best Practices

### 1. Restrict SSH Access
```bash
# Update security group to allow SSH only from your IP
MY_IP=$(curl -s ifconfig.me)
aws ec2 revoke-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp --port 22 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp --port 22 --cidr ${MY_IP}/32
```

### 2. Enable CloudTrail for Auditing
```bash
aws cloudtrail create-trail \
    --name sis-edfi-trail \
    --s3-bucket-name your-trail-bucket
```

### 3. Create IAM Role for EC2 (optional)
```bash
# Create role with limited permissions
aws iam create-role \
    --role-name SISEdFiEC2Role \
    --assume-role-policy-document file://ec2-trust-policy.json

aws iam attach-role-policy \
    --role-name SISEdFiEC2Role \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

## 🚨 Troubleshooting

### Can't connect via SSH
```bash
# Check instance status
aws ec2 describe-instance-status --instance-ids $INSTANCE_ID

# Check security group rules
aws ec2 describe-security-groups --group-ids $SG_ID

# Check if instance has public IP
aws ec2 describe-instances --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress'
```

### Instance running but services not accessible
```bash
# SSH in and check Docker
ssh -i key.pem ec2-user@$PUBLIC_IP
docker ps
docker-compose logs
```

### Clean up everything
```bash
# Terminate instance
aws ec2 terminate-instances --instance-ids $INSTANCE_ID

# Delete security group (after instance is terminated)
aws ec2 delete-security-group --group-id $SG_ID

# Delete key pair
aws ec2 delete-key-pair --key-name sis-edfi-key
```

## 📊 Monitoring Your Deployment

### View CloudWatch Metrics
```bash
aws cloudwatch get-metric-statistics \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --dimensions Name=InstanceId,Value=$INSTANCE_ID \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average
```

### Set Up Alarms
```bash
aws cloudwatch put-metric-alarm \
    --alarm-name high-cpu-usage \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=InstanceId,Value=$INSTANCE_ID \
    --evaluation-periods 2
```

## 🎉 Success!

Once deployed, you'll have:
- ✅ Complete SIS application (frontend + backend)
- ✅ Ed-Fi ODS with all components
- ✅ PostgreSQL databases
- ✅ Nginx reverse proxy
- ✅ Docker networking configured
- ✅ All services auto-starting

Access your deployment at:
- Main App: `http://[PUBLIC_IP]`
- SIS Frontend: `http://[PUBLIC_IP]:3000`
- SIS Backend: `http://[PUBLIC_IP]:5000`
- Ed-Fi API: `http://[PUBLIC_IP]:8001`
- Ed-Fi Swagger: `http://[PUBLIC_IP]:8002`
- Ed-Fi Sandbox: `http://[PUBLIC_IP]:8003`

---

**Need help?** Check the logs:
```bash
ssh -i key.pem ec2-user@[PUBLIC_IP]
docker-compose logs -f
```