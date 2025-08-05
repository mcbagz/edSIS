import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

dotenv.config();

// Logger setup
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

// Initialize Prisma
const prisma = new PrismaClient();

// Ed-Fi API client
const edfiApi = axios.create({
  baseURL: process.env.EDFI_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ed-Fi authentication
let edfiToken: string | null = null;
let tokenExpiry: number = 0;

async function getEdFiToken(): Promise<string> {
  if (edfiToken && Date.now() < tokenExpiry) {
    return edfiToken;
  }

  try {
    const response = await axios.post(
      `${process.env.EDFI_API_BASE_URL}/oauth/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.EDFI_API_CLIENT_ID || '',
        client_secret: process.env.EDFI_API_CLIENT_SECRET || '',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    edfiToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000; // Refresh 5 min early
    
    return edfiToken;
  } catch (error) {
    logger.error('Failed to get Ed-Fi token:', error);
    throw error;
  }
}

// Add auth interceptor
edfiApi.interceptors.request.use(async (config) => {
  const token = await getEdFiToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sync functions
async function syncStudents() {
  logger.info('Starting student sync...');
  
  try {
    // Get all active students from our database
    const students = await prisma.student.findMany({
      where: { enrollmentStatus: 'Active' },
      include: {
        studentParents: {
          include: {
            parent: true
          }
        },
        enrollments: {
          where: { status: 'Active' },
          include: {
            courseSection: {
              include: {
                course: true,
                school: true
              }
            }
          }
        }
      }
    });

    for (const student of students) {
      try {
        // Check if student exists in Ed-Fi
        const edfiStudents = await edfiApi.get('/ed-fi/students', {
          params: { studentUniqueId: student.studentUniqueId }
        });

        const edfiStudent = {
          studentUniqueId: student.studentUniqueId,
          firstName: student.firstName,
          lastSurname: student.lastName,
          middleName: student.middleName,
          birthDate: student.birthDate.toISOString().split('T')[0],
          birthSex: student.gender || 'NotSelected',
        };

        if (edfiStudents.data.length === 0) {
          // Create new student in Ed-Fi
          await edfiApi.post('/ed-fi/students', edfiStudent);
          logger.info(`Created student ${student.studentUniqueId} in Ed-Fi`);
        } else {
          // Update existing student
          const existingId = edfiStudents.data[0].id;
          await edfiApi.put(`/ed-fi/students/${existingId}`, edfiStudent);
          logger.info(`Updated student ${student.studentUniqueId} in Ed-Fi`);
        }

        // Sync student school associations
        for (const enrollment of student.enrollments) {
          if (enrollment.courseSection?.school) {
            await syncStudentSchoolAssociation(
              student.studentUniqueId,
              enrollment.courseSection.school.schoolId,
              student.gradeLevel
            );
          }
        }

        // Sync parent associations
        for (const sp of student.studentParents) {
          await syncParentAssociation(student.studentUniqueId, sp.parent);
        }

      } catch (error) {
        logger.error(`Failed to sync student ${student.studentUniqueId}:`, error);
      }
    }

    logger.info('Student sync completed');
  } catch (error) {
    logger.error('Student sync failed:', error);
  }
}

async function syncStudentSchoolAssociation(
  studentUniqueId: string,
  schoolId: number,
  gradeLevel: string
) {
  try {
    const association = {
      studentReference: {
        studentUniqueId
      },
      schoolReference: {
        schoolId
      },
      entryDate: new Date().toISOString().split('T')[0],
      entryGradeLevelDescriptor: `uri://ed-fi.org/GradeLevelDescriptor#${gradeLevel}`,
    };

    await edfiApi.post('/ed-fi/studentSchoolAssociations', association);
  } catch (error: any) {
    if (error.response?.status !== 409) { // Ignore if already exists
      logger.error('Failed to sync school association:', error);
    }
  }
}

async function syncParentAssociation(studentUniqueId: string, parent: any) {
  try {
    // First, ensure parent exists in Ed-Fi
    const edfiParent = {
      parentUniqueId: `PARENT_${parent.id}`,
      firstName: parent.firstName,
      lastSurname: parent.lastName,
    };

    await edfiApi.post('/ed-fi/parents', edfiParent).catch((error) => {
      if (error.response?.status !== 409) throw error;
    });

    // Create association
    const association = {
      studentReference: {
        studentUniqueId
      },
      parentReference: {
        parentUniqueId: edfiParent.parentUniqueId
      },
      relationDescriptor: 'uri://ed-fi.org/RelationDescriptor#Parent',
    };

    await edfiApi.post('/ed-fi/studentParentAssociations', association);
  } catch (error: any) {
    if (error.response?.status !== 409) {
      logger.error('Failed to sync parent association:', error);
    }
  }
}

async function syncAttendance() {
  logger.info('Starting attendance sync...');
  
  try {
    // Get today's attendance records
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today
        }
      },
      include: {
        student: true,
        courseSection: {
          include: {
            school: true
          }
        }
      }
    });

    for (const attendance of attendances) {
      try {
        const attendanceEvent = {
          studentReference: {
            studentUniqueId: attendance.student.studentUniqueId
          },
          schoolReference: {
            schoolId: attendance.courseSection?.school.schoolId
          },
          sessionReference: {
            sessionName: 'Current Session',
            schoolId: attendance.courseSection?.school.schoolId,
            schoolYear: new Date().getFullYear()
          },
          eventDate: attendance.date.toISOString().split('T')[0],
          attendanceEventCategoryDescriptor: `uri://ed-fi.org/AttendanceEventCategoryDescriptor#${attendance.attendanceCode}`,
        };

        await edfiApi.post('/ed-fi/attendanceEvents', attendanceEvent);
        logger.info(`Synced attendance for ${attendance.student.studentUniqueId}`);
      } catch (error: any) {
        if (error.response?.status !== 409) {
          logger.error('Failed to sync attendance:', error);
        }
      }
    }

    logger.info('Attendance sync completed');
  } catch (error) {
    logger.error('Attendance sync failed:', error);
  }
}

async function syncGrades() {
  logger.info('Starting grades sync...');
  
  try {
    // Get recent grades
    const grades = await prisma.grade.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        student: true,
        courseSection: {
          include: {
            course: true,
            school: true,
            session: true
          }
        },
        gradingPeriod: true
      }
    });

    for (const grade of grades) {
      try {
        const gradeRecord = {
          studentReference: {
            studentUniqueId: grade.student.studentUniqueId
          },
          studentSectionAssociationReference: {
            studentUniqueId: grade.student.studentUniqueId,
            sectionIdentifier: grade.courseSection.sectionIdentifier,
            sessionName: grade.courseSection.session.name,
            localCourseCode: grade.courseSection.course.courseCode,
            schoolId: grade.courseSection.school.schoolId,
            schoolYear: new Date().getFullYear()
          },
          gradeTypeDescriptor: `uri://ed-fi.org/GradeTypeDescriptor#${grade.gradeType}`,
          numericGradeEarned: grade.numericGrade,
          letterGradeEarned: grade.letterGrade,
          gradingPeriodReference: grade.gradingPeriod ? {
            gradingPeriodDescriptor: `uri://ed-fi.org/GradingPeriodDescriptor#${grade.gradingPeriod.name}`,
            periodSequence: 1,
            schoolId: grade.courseSection.school.schoolId,
            schoolYear: new Date().getFullYear()
          } : undefined
        };

        await edfiApi.post('/ed-fi/grades', gradeRecord);
        logger.info(`Synced grade for ${grade.student.studentUniqueId}`);
      } catch (error: any) {
        if (error.response?.status !== 409) {
          logger.error('Failed to sync grade:', error);
        }
      }
    }

    logger.info('Grades sync completed');
  } catch (error) {
    logger.error('Grades sync failed:', error);
  }
}

// Main sync function
async function performSync() {
  logger.info('Starting Ed-Fi sync cycle...');
  
  try {
    await syncStudents();
    await syncAttendance();
    await syncGrades();
    
    logger.info('Ed-Fi sync cycle completed successfully');
  } catch (error) {
    logger.error('Ed-Fi sync cycle failed:', error);
  }
}

// Start the sync service
async function start() {
  logger.info('Ed-Fi Sync Service starting...');
  
  // Test database connection
  try {
    await prisma.$connect();
    logger.info('Connected to database');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }

  // Test Ed-Fi connection
  try {
    await getEdFiToken();
    logger.info('Connected to Ed-Fi ODS');
  } catch (error) {
    logger.error('Failed to connect to Ed-Fi ODS:', error);
    logger.warn('Continuing without Ed-Fi sync...');
  }

  // Perform initial sync
  await performSync();

  // Schedule regular syncs
  const syncInterval = process.env.SYNC_INTERVAL 
    ? parseInt(process.env.SYNC_INTERVAL) 
    : 5 * 60 * 1000; // Default 5 minutes

  // Convert milliseconds to cron expression (every N minutes)
  const minutes = Math.floor(syncInterval / 60000);
  const cronExpression = `*/${minutes} * * * *`;

  cron.schedule(cronExpression, async () => {
    await performSync();
  });

  logger.info(`Sync scheduled every ${minutes} minutes`);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the service
start().catch((error) => {
  logger.error('Failed to start sync service:', error);
  process.exit(1);
});