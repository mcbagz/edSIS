# SIS Backend Server

This is the backend server for the Student Information System, providing REST APIs for admissions, enrollment, and other school management features.

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL database
- AWS account (for S3 and SES services) - optional for document uploads and email notifications
- Ed-Fi ODS instance (optional, for integration)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your actual configuration:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `JWT_SECRET`: A secure secret for JWT token generation
     - AWS credentials (optional, for document uploads and emails)
     - Ed-Fi API credentials (optional, for Ed-Fi integration)

3. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed the database with sample data
   npm run prisma:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The server will start on http://localhost:5000

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio for database management
- `npm run prisma:seed` - Seed database with sample data

## API Documentation

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Applications
- `GET /api/applications` - List all applications (Admin only)
- `GET /api/applications/:id` - Get single application (Admin only)
- `POST /api/applications` - Create new application (Public)
- `PATCH /api/applications/:id/status` - Update application status (Admin only)
- `POST /api/applications/upload-url` - Get presigned URL for document upload
- `PATCH /api/applications/:id/documents` - Update application documents

### Enrollment
- `GET /api/enrollment/courses` - Get available courses
- `GET /api/enrollment/homerooms` - Get available homerooms
- `GET /api/enrollment/student/:studentId` - Get student's enrollments
- `POST /api/enrollment` - Enroll student in courses and homeroom
- `DELETE /api/enrollment/:enrollmentId` - Drop a course

### Webhooks
- `POST /api/webhooks/process-accepted-application` - Process accepted applications (Admin only)

## Database Schema

The database schema includes models for:
- Users (with role-based access control)
- Prospective Students and Applications
- Students, Parents, and Staff
- Schools, Sessions, and Grading Periods
- Courses, Course Sections, and Enrollments
- Attendance and Grades
- Discipline Incidents and Actions

See `prisma/schema.prisma` for the complete schema definition.

## Testing

Default admin credentials (from seed data):
- Email: admin@school.edu
- Password: admin123

Default teacher credentials:
- Email: john.doe@school.edu
- Password: teacher123

## Security Notes

- All API endpoints except application creation require authentication
- Role-based access control is enforced on all endpoints
- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- CORS is configured to only allow requests from the frontend URL

## AWS Services (Optional)

If AWS credentials are configured:
- **S3**: Used for storing application documents
- **SES**: Used for sending acceptance emails and notifications

Make sure to configure the appropriate IAM permissions for these services.