@echo off
echo Setting up SIS Backend...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
) else (
    echo Dependencies already installed.
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please update the .env file with your database credentials!
    echo Default PostgreSQL connection string: postgresql://postgres:postgres@localhost:5432/sis_db
    echo.
)

REM Generate Prisma client
echo.
echo Generating Prisma client...
call npm run prisma:generate

REM Ask user if they want to run migrations
echo.
set /p runMigrations="Do you want to run database migrations? (y/n): "
if /i "%runMigrations%"=="y" (
    echo Running migrations...
    call npm run prisma:migrate
)

REM Ask user if they want to seed the database
echo.
set /p seedDatabase="Do you want to seed the database with sample data? (y/n): "
if /i "%seedDatabase%"=="y" (
    echo Seeding database...
    call npm run prisma:seed
)

echo.
echo Setup complete!
echo.
echo Sample login credentials:
echo   Admin: admin@school.edu / admin123
echo   Teacher: teacher@school.edu / teacher123
echo   Parent: parent@school.edu / parent123
echo   Student: student@school.edu / student123
echo.
echo To start the server, run: npm run dev
echo.
pause