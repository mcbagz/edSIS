@echo off
echo Starting SIS Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker Desktop.
    exit /b 1
)

REM Start PostgreSQL with Docker
echo Starting PostgreSQL database...
docker-compose -f docker-compose.dev.yml up -d

REM Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

REM Check if database is ready
:wait_for_db
docker exec sis-postgres-dev pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo Waiting for database...
    timeout /t 2 /nobreak >nul
    goto wait_for_db
)

echo PostgreSQL is ready!

REM Run migrations and seed
echo Setting up database...
cd sis-backend
call npm run prisma:generate
call npm run prisma:migrate deploy
call npm run prisma:seed
cd ..

echo.
echo Development environment is ready!
echo.
echo PostgreSQL is running at: localhost:5432
echo PgAdmin is available at: http://localhost:5050
echo   Email: admin@school.edu
echo   Password: admin123
echo.
echo To start the backend server:
echo   cd sis-backend ^&^& npm run dev
echo.
echo To start the frontend:
echo   cd sis-app ^&^& npm run dev
echo.
echo To stop PostgreSQL:
echo   docker-compose -f docker-compose.dev.yml down
echo.
pause