# PowerShell version of AWS CLI Deployment Script
# For Windows users

param(
    [string]$Region = "us-east-1",
    [string]$InstanceType = "t3.medium",
    [string]$KeyName = "sis-edfi-key",
    [string]$SecurityGroupName = "sis-edfi-sg",
    [string]$InstanceName = "SIS-EdFi-Stack"
)

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host "================================================" -ForegroundColor Blue
Write-Host "AWS CLI Deployment for SIS + Ed-Fi ODS" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

# Check AWS CLI
Write-Host "Checking AWS CLI configuration..." -ForegroundColor Yellow
$identity = aws sts get-caller-identity --query "Arn" --output text 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AWS CLI is configured" -ForegroundColor Green
    Write-Host "  Using identity: $identity" -ForegroundColor Green
} else {
    Write-Host "AWS CLI is not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Create or get SSH key pair
Write-Host ""
Write-Host "Setting up SSH key pair..." -ForegroundColor Yellow

$keyExists = aws ec2 describe-key-pairs --key-names $KeyName --region $Region 2>$null
if ($?) {
    Write-Host "✓ Key pair '$KeyName' already exists" -ForegroundColor Green
} else {
    Write-Host "Creating new key pair '$KeyName'..." -ForegroundColor Yellow
    $keyMaterial = aws ec2 create-key-pair `
        --key-name $KeyName `
        --query "KeyMaterial" `
        --output text `
        --region $Region
    
    $keyMaterial | Out-File -FilePath "$KeyName.pem" -Encoding ASCII
    Write-Host "✓ Key pair created and saved to $KeyName.pem" -ForegroundColor Green
    Write-Host "  IMPORTANT: Keep this file safe!" -ForegroundColor Yellow
}

# Get default VPC
$vpcId = aws ec2 describe-vpcs `
    --filters "Name=is-default,Values=true" `
    --query "Vpcs[0].VpcId" `
    --output text `
    --region $Region

# Create security group
Write-Host ""
Write-Host "Setting up security group..." -ForegroundColor Yellow

$sgId = aws ec2 describe-security-groups `
    --filters "Name=group-name,Values=$SecurityGroupName" `
    --query "SecurityGroups[0].GroupId" `
    --output text `
    --region $Region 2>$null

if (!$sgId -or $sgId -eq "None") {
    Write-Host "Creating security group '$SecurityGroupName'..." -ForegroundColor Yellow
    
    $sgId = aws ec2 create-security-group `
        --group-name $SecurityGroupName `
        --description "Security group for SIS + Ed-Fi ODS stack" `
        --vpc-id $vpcId `
        --query "GroupId" `
        --output text `
        --region $Region
    
    Write-Host "✓ Security group created: $sgId" -ForegroundColor Green
    
    # Add rules
    Write-Host "Adding security group rules..." -ForegroundColor Yellow
    
    $ports = @(22, 80, 443, 3000, 5000, 8001, 8002, 8003)
    foreach ($port in $ports) {
        aws ec2 authorize-security-group-ingress `
            --group-id $sgId `
            --protocol tcp `
            --port $port `
            --cidr 0.0.0.0/0 `
            --region $Region 2>$null
    }
    
    Write-Host "✓ Security group rules added" -ForegroundColor Green
} else {
    Write-Host "✓ Security group '$SecurityGroupName' already exists: $sgId" -ForegroundColor Green
}

# Get latest Amazon Linux 2 AMI
Write-Host ""
Write-Host "Getting latest Amazon Linux 2 AMI..." -ForegroundColor Yellow

$amiId = aws ec2 describe-images `
    --owners amazon `
    --filters `
        "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" `
        "Name=state,Values=available" `
    --query "sort_by(Images, &CreationDate)[-1].ImageId" `
    --output text `
    --region $Region

Write-Host "✓ AMI ID: $amiId" -ForegroundColor Green

# Create user data script
Write-Host ""
Write-Host "Creating user data script..." -ForegroundColor Yellow

$userData = @"
#!/bin/bash
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo 'Starting deployment at `$(date)'

# Update system
yum update -y

# Install Docker
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user
chkconfig docker on

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
yum install git -y

# Create application directory
mkdir -p /opt/sis-edfi
cd /opt/sis-edfi

# Create a simple docker-compose to verify deployment
cat > docker-compose.yml << 'DOCKEREOF'
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html:ro
    restart: always
DOCKEREOF

# Create index.html
cat > index.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <title>SIS + Ed-Fi ODS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2e6da4; }
        .status { color: green; font-weight: bold; }
        .service { margin: 10px 0; padding: 10px; background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>SIS + Ed-Fi ODS Stack</h1>
    <p class="status">✓ Deployment Successful!</p>
    
    <h2>Services (will be available at):</h2>
    <div class="service">Main App: Port 80</div>
    <div class="service">SIS Frontend: Port 3000</div>
    <div class="service">SIS Backend: Port 5000</div>
    <div class="service">Ed-Fi API: Port 8001</div>
    <div class="service">Ed-Fi Swagger: Port 8002</div>
    <div class="service">Ed-Fi Sandbox: Port 8003</div>
    
    <h2>Next Steps:</h2>
    <ol>
        <li>SSH into this instance</li>
        <li>Clone your repository</li>
        <li>Run docker-compose with your application</li>
    </ol>
</body>
</html>
HTMLEOF

# Start Docker Compose
docker-compose up -d

# Create systemd service
echo '[Unit]' > /etc/systemd/system/sis-edfi.service
echo 'Description=SIS Ed-Fi Docker Compose Application' >> /etc/systemd/system/sis-edfi.service
echo 'Requires=docker.service' >> /etc/systemd/system/sis-edfi.service
echo 'After=docker.service' >> /etc/systemd/system/sis-edfi.service
echo '' >> /etc/systemd/system/sis-edfi.service
echo '[Service]' >> /etc/systemd/system/sis-edfi.service
echo 'Type=oneshot' >> /etc/systemd/system/sis-edfi.service
echo 'RemainAfterExit=yes' >> /etc/systemd/system/sis-edfi.service
echo 'WorkingDirectory=/opt/sis-edfi' >> /etc/systemd/system/sis-edfi.service
echo 'ExecStart=/usr/local/bin/docker-compose up -d' >> /etc/systemd/system/sis-edfi.service
echo 'ExecStop=/usr/local/bin/docker-compose down' >> /etc/systemd/system/sis-edfi.service
echo 'TimeoutStartSec=0' >> /etc/systemd/system/sis-edfi.service
echo '' >> /etc/systemd/system/sis-edfi.service
echo '[Install]' >> /etc/systemd/system/sis-edfi.service
echo 'WantedBy=multi-user.target' >> /etc/systemd/system/sis-edfi.service

systemctl enable sis-edfi.service

echo 'Deployment completed at `$(date)'
touch /tmp/deployment-complete
"@

$userData | Out-File -FilePath "user-data.txt" -Encoding ASCII

# Launch EC2 instance
Write-Host ""
Write-Host "Launching EC2 instance..." -ForegroundColor Yellow

$instanceId = aws ec2 run-instances `
    --image-id $amiId `
    --instance-type $InstanceType `
    --key-name $KeyName `
    --security-group-ids $sgId `
    --user-data file://user-data.txt `
    --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=40,VolumeType=gp3}" `
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$InstanceName}]" `
    --query "Instances[0].InstanceId" `
    --output text `
    --region $Region

Write-Host "✓ Instance launched: $instanceId" -ForegroundColor Green

# Wait for instance to be running
Write-Host "Waiting for instance to start..." -ForegroundColor Yellow
aws ec2 wait instance-running --instance-ids $instanceId --region $Region

# Get instance details
$publicIp = aws ec2 describe-instances `
    --instance-ids $instanceId `
    --query "Reservations[0].Instances[0].PublicIpAddress" `
    --output text `
    --region $Region

$privateIp = aws ec2 describe-instances `
    --instance-ids $instanceId `
    --query "Reservations[0].Instances[0].PrivateIpAddress" `
    --output text `
    --region $Region

Write-Host "✓ Instance is running!" -ForegroundColor Green
Write-Host "  Instance ID: $instanceId" -ForegroundColor Green
Write-Host "  Public IP: $publicIp" -ForegroundColor Green
Write-Host "  Private IP: $privateIp" -ForegroundColor Green

# Display connection information
Write-Host ""
Write-Host "================================================" -ForegroundColor Blue
Write-Host "Deployment Complete!" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Instance Information:" -ForegroundColor Green
Write-Host "  Instance ID: $instanceId" -ForegroundColor Yellow
Write-Host "  Public IP: $publicIp" -ForegroundColor Yellow
Write-Host "  Region: $Region" -ForegroundColor Yellow
Write-Host ""
Write-Host "SSH Access:" -ForegroundColor Green
Write-Host "  ssh -i $KeyName.pem ec2-user@$publicIp" -ForegroundColor Yellow
Write-Host ""
Write-Host "Web Access:" -ForegroundColor Green
Write-Host "  Main Application: http://$publicIp" -ForegroundColor Yellow
Write-Host "  SIS Frontend: http://${publicIp}:3000" -ForegroundColor Yellow
Write-Host "  SIS Backend API: http://${publicIp}:5000" -ForegroundColor Yellow
Write-Host "  Ed-Fi API: http://${publicIp}:8001" -ForegroundColor Yellow
Write-Host "  Ed-Fi Swagger: http://${publicIp}:8002" -ForegroundColor Yellow
Write-Host "  Ed-Fi Sandbox: http://${publicIp}:8003" -ForegroundColor Yellow
Write-Host ""
Write-Host "To terminate this instance later:" -ForegroundColor Yellow
Write-Host "  aws ec2 terminate-instances --instance-ids $instanceId --region $Region" -ForegroundColor Yellow

# Save instance details
@"
SIS + Ed-Fi ODS AWS Deployment
==============================
Date: $(Get-Date)
Instance ID: $instanceId
Public IP: $publicIp
Private IP: $privateIp
Region: $Region
Key Name: $KeyName
Security Group: $sgId

SSH Command:
ssh -i $KeyName.pem ec2-user@$publicIp

PowerShell SSH (Windows):
ssh -i .\$KeyName.pem ec2-user@$publicIp

Terminate Command:
aws ec2 terminate-instances --instance-ids $instanceId --region $Region
"@ | Out-File -FilePath "instance-details.txt"

Write-Host ""
Write-Host "Instance details saved to: instance-details.txt" -ForegroundColor Green

# Clean up
Remove-Item -Path "user-data.txt" -Force -ErrorAction SilentlyContinue