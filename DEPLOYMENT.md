# SIS Deployment Guide

This guide covers deployment of the Student Information System with Docker, including integration with Ed-Fi ODS.

## Architecture Overview

The system consists of:
- **PostgreSQL**: Primary database for SIS operations
- **SIS Backend**: Node.js/Express API server
- **SIS Frontend**: React application served by Nginx
- **Ed-Fi Sync Service**: Synchronizes data to Ed-Fi ODS
- **Ed-Fi ODS**: External data warehouse (existing installation)

## Quick Start (Development)

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ (for local development)
- PostgreSQL client tools (optional, for direct DB access)

### Start Development Environment

**Windows:**
```bash
start-dev.bat
```

**Mac/Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

This will:
1. Start PostgreSQL in Docker
2. Run database migrations
3. Seed sample data
4. Make PgAdmin available at http://localhost:5050

### Run Applications Locally

1. **Backend:**
   ```bash
   cd sis-backend
   npm install
   npm run dev
   ```
   Backend runs at http://localhost:5000

2. **Frontend:**
   ```bash
   cd sis-app
   npm install
   npm run dev
   ```
   Frontend runs at http://localhost:5177

## Production Deployment

### 1. Environment Setup

Copy and configure environment variables:
```bash
cp .env.docker .env
# Edit .env with your production values
```

**Required configurations:**
- `POSTGRES_PASSWORD`: Strong password for database
- `JWT_SECRET`: Secure random string for JWT tokens
- `EDFI_API_CLIENT_ID/SECRET`: Ed-Fi API credentials
- AWS credentials (if using S3/SES)

### 2. Build and Deploy

**Full stack deployment:**
```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432, internal)
- SIS Backend (port 5000)
- SIS Frontend (port 80)
- Ed-Fi Sync Service

**Production deployment with external Ed-Fi:**
```bash
# Create the Ed-Fi network first (if not exists)
docker network create ed-fi-docker-compose_default

# Start SIS services
docker-compose up -d
```

### 3. Initial Setup

After first deployment:
```bash
# Run database migrations
docker-compose exec sis-backend npm run prisma:migrate deploy

# Seed initial data (optional)
docker-compose exec sis-backend npm run prisma:seed
```

## Ed-Fi Integration

### Network Configuration

The system expects Ed-Fi to be running in Docker with network name `ed-fi-docker-compose_default`. 

If your Ed-Fi uses a different network:
```yaml
# In docker-compose.yml, update:
networks:
  edfi-network:
    external: true
    name: your-edfi-network-name
```

### Data Synchronization

The Ed-Fi sync service automatically:
- Syncs students, parents, and enrollments every 5 minutes
- Syncs attendance records in real-time
- Syncs grades as they're entered

Configure sync interval:
```env
SYNC_INTERVAL=300000  # milliseconds (5 minutes)
```

### Manual Sync

To trigger manual sync:
```bash
docker-compose restart edfi-sync
```

## Database Management

### Access PostgreSQL

**Via PgAdmin (Development):**
- URL: http://localhost:5050
- Email: admin@school.edu
- Password: admin123

**Via psql:**
```bash
docker exec -it sis-postgres psql -U postgres -d sis_db
```

### Backup Database

```bash
# Backup
docker exec sis-postgres pg_dump -U postgres sis_db > backup.sql

# Restore
docker exec -i sis-postgres psql -U postgres sis_db < backup.sql
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f sis-backend
docker-compose logs -f edfi-sync
```

### Health Checks

- Backend health: http://localhost:5000/health
- Frontend: http://localhost
- PostgreSQL: `docker exec sis-postgres pg_isready`

## Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running:
   ```bash
   docker ps | grep sis-postgres
   ```

2. Test connection:
   ```bash
   docker exec sis-postgres pg_isready -U postgres
   ```

3. Check logs:
   ```bash
   docker-compose logs sis-postgres
   ```

### Ed-Fi Sync Issues

1. Check Ed-Fi connectivity:
   ```bash
   docker-compose logs edfi-sync
   ```

2. Verify Ed-Fi credentials in `.env`

3. Ensure Ed-Fi network is accessible:
   ```bash
   docker network ls
   ```

### Frontend Can't Connect to Backend

1. Check CORS settings in backend
2. Verify `VITE_API_URL` in frontend build
3. Check nginx configuration

## Security Considerations

1. **Change all default passwords** before production deployment
2. **Use HTTPS** in production (add SSL certificates to nginx)
3. **Restrict database access** (don't expose port 5432 publicly)
4. **Regular backups** of PostgreSQL data
5. **Monitor logs** for suspicious activity

## Scaling

### Horizontal Scaling

Backend can be scaled:
```yaml
# In docker-compose.yml
sis-backend:
  deploy:
    replicas: 3
```

### Database Scaling

For high availability:
1. Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
2. Configure read replicas
3. Implement connection pooling

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Database Migrations

```bash
# Generate new migration
docker-compose exec sis-backend npm run prisma:migrate dev

# Apply in production
docker-compose exec sis-backend npm run prisma:migrate deploy
```

## Sample Credentials

After seeding, these accounts are available:
- **Admin**: admin@school.edu / admin123
- **Teacher**: teacher@school.edu / teacher123
- **Parent**: parent@school.edu / parent123
- **Student**: student@school.edu / student123

**Remember to change these in production!**