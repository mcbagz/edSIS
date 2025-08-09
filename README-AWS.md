# 🚀 Quick AWS Deployment Guide

## The Simplest Way to Deploy Everything

### Prerequisites
- AWS Account
- Docker installed locally (for testing)

### Step 1: Test Locally First
```bash
# Clone this repository
git clone [your-repo-url]
cd finalsis

# Start everything locally
chmod +x start-all.sh
./start-all.sh

# Or use Docker Compose directly
docker-compose -f docker-compose.all-in-one.yml up -d
```

### Step 2: Deploy to AWS EC2 (Simplest Method)

#### A. Launch EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. Settings:
   - **Name**: SIS-EdFi-Demo
   - **AMI**: Amazon Linux 2
   - **Instance Type**: t3.xlarge (minimum) or t3.2xlarge (recommended)
   - **Key Pair**: Create new or use existing
   - **Network**: Allow HTTP (80), HTTPS (443), SSH (22)
   - **Storage**: 100 GB gp3

#### B. Connect and Deploy
```bash
# SSH into your instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Quick setup script (copy and paste all at once)
sudo yum update -y && \
sudo amazon-linux-extras install docker -y && \
sudo service docker start && \
sudo usermod -a -G docker ec2-user && \
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
sudo chmod +x /usr/local/bin/docker-compose && \
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Logout and login again for group changes
exit
# SSH back in
ssh -i your-key.pem ec2-user@your-instance-ip

# Clone your repository (or upload files)
git clone [your-repo-url] sis-edfi
cd sis-edfi

# Start everything
docker-compose -f docker-compose.all-in-one.yml up -d
```

### Step 3: Access Your Application
After ~2-3 minutes, access:
- **Main App**: `http://your-ec2-ip`
- **Ed-Fi API**: `http://your-ec2-ip:8001`
- **Ed-Fi Swagger**: `http://your-ec2-ip:8002`
- **Ed-Fi Sandbox**: `http://your-ec2-ip:8003`

## 📋 What Gets Deployed?

### Complete Stack:
1. **SIS Application**
   - React Frontend (Port 3000/80)
   - Node.js Backend API (Port 5000)
   - PostgreSQL Database

2. **Ed-Fi ODS**
   - Ed-Fi API (Port 8001)
   - Swagger UI (Port 8002)
   - Sandbox Admin (Port 8003)
   - PostgreSQL Databases (ODS & Admin)

3. **Infrastructure**
   - Nginx Reverse Proxy
   - Docker networking
   - Persistent volumes

## 🔑 Default Credentials

### SIS Application
- **Admin User**: admin@school.edu
- **Password**: Admin123!

### Ed-Fi Sandbox
- **Admin User**: admin@school.edu  
- **Password**: AdminPass123!
- **API Key**: populatedKey
- **API Secret**: populatedSecret

## 💡 Quick Tips

### View Logs
```bash
# All services
docker-compose -f docker-compose.all-in-one.yml logs -f

# Specific service
docker-compose -f docker-compose.all-in-one.yml logs -f sis-backend
```

### Restart Services
```bash
# Restart everything
docker-compose -f docker-compose.all-in-one.yml restart

# Restart specific service
docker-compose -f docker-compose.all-in-one.yml restart sis-backend
```

### Stop Everything
```bash
docker-compose -f docker-compose.all-in-one.yml down
```

### Update and Redeploy
```bash
git pull
docker-compose -f docker-compose.all-in-one.yml build
docker-compose -f docker-compose.all-in-one.yml up -d
```

## 🛡️ Security (Important!)

Before showing to others:

1. **Change default passwords** in docker-compose.all-in-one.yml
2. **Update security group** to restrict SSH access
3. **Use HTTPS** (optional but recommended):
   ```bash
   # Install certbot
   sudo yum install -y certbot
   
   # Get SSL certificate
   sudo certbot certonly --standalone -d your-domain.com
   ```

## 💰 Cost Estimate
- **t3.xlarge EC2**: ~$0.17/hour (~$120/month)
- **Storage (100GB)**: ~$8/month
- **Data Transfer**: ~$10/month
- **Total**: ~$138/month

## 🚨 Troubleshooting

### Services won't start
```bash
# Check disk space
df -h

# Check memory
free -h

# Increase swap if needed
sudo dd if=/dev/zero of=/swapfile bs=1G count=4
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Can't access from browser
- Check security group allows port 80
- Check instance is running: `docker ps`
- Check nginx is running: `docker logs nginx`

## 📞 Need Help?
1. Check container logs: `docker-compose logs [service-name]`
2. Verify all containers running: `docker ps`
3. Test locally first before AWS deployment
4. Use t3.2xlarge if t3.xlarge has performance issues

---

**That's it!** Your complete SIS + Ed-Fi ODS system should be running on AWS in about 10 minutes.