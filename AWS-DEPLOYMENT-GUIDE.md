# AWS Deployment Guide for SIS + Ed-Fi ODS

## 🚀 Quick Start (Simplest Method)

### Option 1: Single EC2 Instance with Docker Compose

This is the **simplest and most cost-effective** approach for demos and small deployments.

#### Prerequisites
- AWS Account
- AWS CLI configured (`aws configure`)
- An EC2 key pair created in AWS

#### Steps:

1. **Launch EC2 Instance via AWS Console:**
   - Go to EC2 Dashboard → Launch Instance
   - Choose: Amazon Linux 2 AMI
   - Instance Type: `t3.xlarge` (4 vCPU, 16GB RAM)
   - Storage: 100GB gp3
   - Security Group: Allow ports 22, 80, 443
   - Key Pair: Select your existing key or create new

2. **Connect to Instance:**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Run Quick Setup Script:**
   ```bash
   # Install Docker and Docker Compose
   sudo yum update -y
   sudo amazon-linux-extras install docker -y
   sudo service docker start
   sudo usermod -a -G docker ec2-user
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Logout and login again for group changes
   exit
   # SSH back in
   
   # Create project directory
   mkdir sis-edfi && cd sis-edfi
   
   # Download the all-in-one docker-compose
   curl -O https://raw.githubusercontent.com/your-repo/docker-compose.all-in-one.yml
   
   # Start everything
   docker-compose -f docker-compose.all-in-one.yml up -d
   ```

4. **Access Your Application:**
   - SIS App: `http://your-instance-ip`
   - SIS API: `http://your-instance-ip/api`
   - Ed-Fi API: `http://your-instance-ip:8001`
   - Ed-Fi Swagger: `http://your-instance-ip:8002`
   - Ed-Fi Sandbox: `http://your-instance-ip:8003`

## 📦 All-in-One Docker Compose

Save this as `docker-compose.all-in-one.yml`:

```yaml
version: '3.8'

services:
  # Single PostgreSQL for both SIS and Ed-Fi
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: SecurePassword123!
      POSTGRES_MULTIPLE_DATABASES: sis_db,EdFi_Ods,EdFi_Admin,EdFi_Security
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-databases.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: always

  # Ed-Fi API (using pre-built images)
  edfi-api:
    image: edfialliance/ods-api-web-api:v7.1
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: SecurePassword123!
      POSTGRES_PORT: 5432
      ODS_POSTGRES_HOST: postgres
      ADMIN_POSTGRES_HOST: postgres
      PATH_BASE: ""
      TPDM_ENABLED: "true"
      ODS_CONNECTION_STRING_ENCRYPTION_KEY: "+MkpJfdOoBs2W+UCibqwMcjAF5rUUk6AxPiOAIFNEWQ="
    ports:
      - "8001:80"
    depends_on:
      - postgres
    restart: always

  # Ed-Fi Swagger
  edfi-swagger:
    image: edfialliance/ods-api-swaggerui:v7.1
    environment:
      SAMPLE_KEY: populatedKey
      SAMPLE_SECRET: populatedSecret
      VERSION_URL: http://edfi-api
    ports:
      - "8002:80"
    depends_on:
      - edfi-api
    restart: always

  # Ed-Fi Sandbox Admin
  edfi-sandbox:
    image: edfialliance/ods-api-web-sandbox-admin:v7.1
    environment:
      PATH_BASE: sandbox
      OAUTH_URL: http://edfi-api/oauth/
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: SecurePassword123!
      POSTGRES_PORT: 5432
      ODS_POSTGRES_HOST: postgres
      ADMIN_POSTGRES_HOST: postgres
      ADMIN_USER: admin@school.edu
      ADMIN_PASSWORD: AdminPass123!
      POPULATED_KEY: populatedKey
      POPULATED_SECRET: populatedSecret
    ports:
      - "8003:80"
    depends_on:
      - edfi-api
    restart: always

  # SIS Backend (you'll need to build this)
  sis-backend:
    build:
      context: ./sis-backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://postgres:SecurePassword123!@postgres:5432/sis_db
      JWT_SECRET: your-jwt-secret-key-change-this
      EDFI_API_URL: http://edfi-api
      EDFI_CLIENT_ID: populatedKey
      EDFI_CLIENT_SECRET: populatedSecret
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - edfi-api
    restart: always

  # SIS Frontend
  sis-frontend:
    build:
      context: ./sis-app
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://your-ec2-ip:5000
    ports:
      - "80:80"
    depends_on:
      - sis-backend
    restart: always

volumes:
  postgres-data:
```

## 🔧 Alternative Deployment Options

### Option 2: AWS ECS with Fargate
Best for production deployments with auto-scaling needs.

### Option 3: AWS EKS (Kubernetes)
Best for large-scale, enterprise deployments.

### Option 4: AWS Elastic Beanstalk
Good for simpler deployments with built-in monitoring.

## 📋 Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure security groups properly
- [ ] Enable AWS WAF for web protection
- [ ] Set up VPC with private subnets

### Database
- [ ] Use RDS for managed PostgreSQL
- [ ] Enable automated backups
- [ ] Configure read replicas if needed
- [ ] Set up monitoring alerts

### Monitoring
- [ ] Enable CloudWatch monitoring
- [ ] Set up application logs
- [ ] Configure alerts for failures
- [ ] Create CloudWatch dashboard

### Scaling
- [ ] Use Application Load Balancer
- [ ] Configure Auto Scaling Groups
- [ ] Set up CloudFront CDN for static assets
- [ ] Use ElastiCache for session management

## 💰 Cost Estimates

### Minimal Setup (Demo/Testing)
- **t3.medium** EC2: ~$30/month
- **Storage** (100GB): ~$8/month
- **Total**: ~$38/month

### Small Production
- **t3.xlarge** EC2: ~$120/month
- **RDS PostgreSQL**: ~$50/month
- **Load Balancer**: ~$25/month
- **Storage & Transfer**: ~$30/month
- **Total**: ~$225/month

### Medium Production
- **2x t3.xlarge** EC2: ~$240/month
- **RDS PostgreSQL (Multi-AZ)**: ~$150/month
- **Application Load Balancer**: ~$25/month
- **CloudFront CDN**: ~$50/month
- **Storage & Transfer**: ~$100/month
- **Total**: ~$565/month

## 🚨 Important Notes

1. **Database Initialization**: The Ed-Fi ODS requires specific database schemas. The Docker images handle this automatically on first run.

2. **Data Persistence**: Always use Docker volumes or external databases to persist data.

3. **Secrets Management**: Use AWS Secrets Manager or Parameter Store for production credentials.

4. **Backup Strategy**: Implement regular backups of both databases and uploaded files.

5. **Domain Setup**: For production, set up a domain name with Route 53 and SSL certificates with ACM.

## 🛠️ Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
docker exec -it postgres psql -U postgres -l

# Check Ed-Fi database initialization
docker exec -it edfi-api cat /app/logs/ods-api.log
```

### Performance Issues
- Increase EC2 instance size
- Enable database connection pooling
- Add Redis for caching
- Use CloudFront for static assets

## 📞 Support Resources

- **Ed-Fi Documentation**: https://techdocs.ed-fi.org/
- **AWS Support**: https://aws.amazon.com/support/
- **Docker Documentation**: https://docs.docker.com/

## 🎯 Next Steps

1. **Test Locally First**: Run `docker-compose up` locally to ensure everything works
2. **Choose Deployment Method**: Start with Option 1 for simplicity
3. **Configure Security**: Update all passwords and security settings
4. **Set Up Monitoring**: Enable CloudWatch and set up alerts
5. **Plan for Scaling**: Design your architecture for future growth

---

## Quick Commands Reference

```bash
# Start all services
docker-compose -f docker-compose.all-in-one.yml up -d

# Stop all services
docker-compose -f docker-compose.all-in-one.yml down

# View logs
docker-compose -f docker-compose.all-in-one.yml logs -f

# Restart a service
docker-compose -f docker-compose.all-in-one.yml restart [service-name]

# Update and rebuild
git pull
docker-compose -f docker-compose.all-in-one.yml build
docker-compose -f docker-compose.all-in-one.yml up -d

# Backup databases
docker exec postgres pg_dump -U postgres sis_db > sis_backup.sql
docker exec postgres pg_dump -U postgres EdFi_Ods > edfi_backup.sql
```