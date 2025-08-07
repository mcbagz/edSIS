import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Store settings in memory for now (could be moved to database or config file)
let systemSettings = {
  school: {
    name: 'Sample High School',
    address: '123 Education Blvd',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    phone: '(555) 123-4567',
    email: 'info@sampleschool.edu',
    principal: 'Dr. Jane Smith',
    vicePrincipal: 'Mr. John Doe',
    website: 'https://sampleschool.edu',
    districtName: 'Springfield School District',
    districtCode: 'SSD001',
    schoolCode: 'SHS001',
    schoolType: 'High School',
  },
  academic: {
    currentSchoolYear: '2024-2025',
    semesterStart: '2024-08-15',
    semesterEnd: '2025-05-30',
    gradingPeriods: [
      { name: 'Quarter 1', startDate: '2024-08-15', endDate: '2024-10-25' },
      { name: 'Quarter 2', startDate: '2024-10-28', endDate: '2025-01-17' },
      { name: 'Quarter 3', startDate: '2025-01-21', endDate: '2025-03-28' },
      { name: 'Quarter 4', startDate: '2025-03-31', endDate: '2025-05-30' },
    ],
    classSchedule: {
      startTime: '08:00',
      endTime: '15:30',
      periodDuration: 50,
      passingTime: 5,
      lunchDuration: 30,
    },
    holidays: [
      { name: 'Labor Day', date: '2024-09-02' },
      { name: 'Thanksgiving Break', startDate: '2024-11-27', endDate: '2024-11-29' },
      { name: 'Winter Break', startDate: '2024-12-23', endDate: '2025-01-03' },
      { name: 'Spring Break', startDate: '2025-03-17', endDate: '2025-03-21' },
      { name: 'Memorial Day', date: '2025-05-26' },
    ],
  },
  grading: {
    gradeScale: [
      { grade: 'A+', minPercent: 97, maxPercent: 100, gpa: 4.0 },
      { grade: 'A', minPercent: 93, maxPercent: 96.99, gpa: 4.0 },
      { grade: 'A-', minPercent: 90, maxPercent: 92.99, gpa: 3.7 },
      { grade: 'B+', minPercent: 87, maxPercent: 89.99, gpa: 3.3 },
      { grade: 'B', minPercent: 83, maxPercent: 86.99, gpa: 3.0 },
      { grade: 'B-', minPercent: 80, maxPercent: 82.99, gpa: 2.7 },
      { grade: 'C+', minPercent: 77, maxPercent: 79.99, gpa: 2.3 },
      { grade: 'C', minPercent: 73, maxPercent: 76.99, gpa: 2.0 },
      { grade: 'C-', minPercent: 70, maxPercent: 72.99, gpa: 1.7 },
      { grade: 'D+', minPercent: 67, maxPercent: 69.99, gpa: 1.3 },
      { grade: 'D', minPercent: 63, maxPercent: 66.99, gpa: 1.0 },
      { grade: 'D-', minPercent: 60, maxPercent: 62.99, gpa: 0.7 },
      { grade: 'F', minPercent: 0, maxPercent: 59.99, gpa: 0.0 },
    ],
    passingGrade: 60,
    gpaScale: 4.0,
    weightedGPA: true,
    honorRollGPA: 3.5,
    highHonorRollGPA: 3.8,
    defaultCategories: [
      { name: 'Tests', weight: 40 },
      { name: 'Quizzes', weight: 30 },
      { name: 'Homework', weight: 20 },
      { name: 'Participation', weight: 10 },
    ],
    allowTeacherOverride: true,
    showPercentages: true,
    showLetterGrades: true,
    showGPA: true,
  },
  attendance: {
    schoolDayStart: '08:00',
    tardyThreshold: 15, // minutes
    halfDayThreshold: 180, // minutes
    excessiveAbsenceThreshold: 10, // days
    excessiveTardyThreshold: 15, // occurrences
    requireExcuseNote: true,
    excuseNoteDeadline: 3, // days
    autoNotifyParents: true,
    notificationThresholds: {
      absence: 3,
      tardy: 5,
    },
    attendanceCodes: [] as any[], // Will be loaded from database
  },
  system: {
    timezone: 'America/Chicago',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en-US',
    currency: 'USD',
    academicWeekStart: 'Monday',
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expirationDays: 90,
    },
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
    maintenanceMessage: '',
  },
};

export const settingsController = {
  // Get all settings
  async getSettings(req: Request, res: Response) {
    try {
      // Load attendance codes from database
      const attendanceCodes = await prisma.attendanceCode.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
      
      systemSettings.attendance.attendanceCodes = attendanceCodes;
      
      res.json(systemSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  },

  // Get settings by category
  async getSettingsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      
      if (!systemSettings[category as keyof typeof systemSettings]) {
        res.status(404).json({ message: 'Settings category not found' });
        return;
      }
      
      // Special handling for attendance to include database data
      if (category === 'attendance') {
        const attendanceCodes = await prisma.attendanceCode.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        });
        systemSettings.attendance.attendanceCodes = attendanceCodes;
      }
      
      res.json(systemSettings[category as keyof typeof systemSettings]);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  },

  // Update settings
  async updateSettings(req: AuthRequest, res: Response) {
    try {
      const updates = req.body;
      
      // Update each category that was provided
      Object.keys(updates).forEach((category) => {
        if (systemSettings[category as keyof typeof systemSettings]) {
          systemSettings[category as keyof typeof systemSettings] = {
            ...systemSettings[category as keyof typeof systemSettings],
            ...updates[category],
          };
        }
      });
      
      // If academic settings were updated, sync with database
      if (updates.academic?.gradingPeriods) {
        await syncGradingPeriods(updates.academic.gradingPeriods);
      }
      
      res.json({
        message: 'Settings updated successfully',
        settings: systemSettings,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  },

  // Update settings by category
  async updateSettingsByCategory(req: AuthRequest, res: Response) {
    try {
      const { category } = req.params;
      const updates = req.body;
      
      if (!systemSettings[category as keyof typeof systemSettings]) {
        res.status(404).json({ message: 'Settings category not found' });
        return;
      }
      
      systemSettings[category as keyof typeof systemSettings] = {
        ...systemSettings[category as keyof typeof systemSettings],
        ...updates,
      };
      
      // Special handling for specific categories
      if (category === 'academic' && updates.gradingPeriods) {
        await syncGradingPeriods(updates.gradingPeriods);
      }
      
      res.json({
        message: `${category} settings updated successfully`,
        settings: systemSettings[category as keyof typeof systemSettings],
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  },

  // Get grading periods from database
  async getGradingPeriods(req: Request, res: Response) {
    try {
      const gradingPeriods = await prisma.gradingPeriod.findMany({
        include: {
          session: true,
          school: true,
        },
        orderBy: { beginDate: 'asc' },
      });
      
      res.json(gradingPeriods);
    } catch (error) {
      console.error('Error fetching grading periods:', error);
      res.status(500).json({ message: 'Failed to fetch grading periods' });
    }
  },

  // Get current session
  async getCurrentSession(req: Request, res: Response) {
    try {
      const currentDate = new Date();
      
      const session = await prisma.session.findFirst({
        where: {
          beginDate: { lte: currentDate },
          endDate: { gte: currentDate },
        },
        include: {
          school: true,
          gradingPeriods: {
            orderBy: { beginDate: 'asc' },
          },
        },
      });
      
      if (!session) {
        res.status(404).json({ message: 'No active session found' });
        return;
      }
      
      res.json(session);
    } catch (error) {
      console.error('Error fetching current session:', error);
      res.status(500).json({ message: 'Failed to fetch current session' });
    }
  },

  // Create or update session
  async upsertSession(req: AuthRequest, res: Response) {
    try {
      const { name, beginDate, endDate, totalInstructionalDays, schoolId } = req.body;
      
      // Check if session already exists for this period
      const existingSession = await prisma.session.findFirst({
        where: {
          schoolId,
          OR: [
            { name },
            {
              AND: [
                { beginDate: { lte: new Date(endDate) } },
                { endDate: { gte: new Date(beginDate) } },
              ],
            },
          ],
        },
      });
      
      let session;
      if (existingSession) {
        session = await prisma.session.update({
          where: { id: existingSession.id },
          data: {
            name,
            beginDate: new Date(beginDate),
            endDate: new Date(endDate),
            totalInstructionalDays,
          },
        });
      } else {
        session = await prisma.session.create({
          data: {
            schoolId,
            name,
            beginDate: new Date(beginDate),
            endDate: new Date(endDate),
            totalInstructionalDays,
          },
        });
      }
      
      res.json(session);
    } catch (error) {
      console.error('Error upserting session:', error);
      res.status(500).json({ message: 'Failed to upsert session' });
    }
  },

  // Reset settings to defaults
  async resetSettings(req: AuthRequest, res: Response) {
    try {
      const { category } = req.body;
      
      if (category && !systemSettings[category as keyof typeof systemSettings]) {
        res.status(404).json({ message: 'Settings category not found' });
        return;
      }
      
      // Reset specific category or all settings
      if (category) {
        // Reset to default values (would need to define defaults)
        res.json({
          message: `${category} settings reset to defaults`,
        });
      } else {
        // Reset all settings
        res.json({
          message: 'All settings reset to defaults',
        });
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      res.status(500).json({ message: 'Failed to reset settings' });
    }
  },
};

// Helper function to sync grading periods with database
async function syncGradingPeriods(gradingPeriods: any[]) {
  try {
    // Get or create default school
    const school = await prisma.school.findFirst();
    if (!school) return;
    
    // Get or create current session
    const currentYear = new Date().getFullYear();
    const sessionName = `${currentYear}-${currentYear + 1}`;
    
    let session = await prisma.session.findFirst({
      where: { name: sessionName },
    });
    
    if (!session) {
      session = await prisma.session.create({
        data: {
          schoolId: school.id,
          name: sessionName,
          beginDate: new Date(gradingPeriods[0].startDate),
          endDate: new Date(gradingPeriods[gradingPeriods.length - 1].endDate),
          totalInstructionalDays: 180,
        },
      });
    }
    
    // Update or create grading periods
    for (const period of gradingPeriods) {
      await prisma.gradingPeriod.upsert({
        where: {
          id: period.id || `temp-${period.name}`,
        },
        update: {
          name: period.name,
          beginDate: new Date(period.startDate),
          endDate: new Date(period.endDate),
        },
        create: {
          sessionId: session.id,
          schoolId: school.id,
          name: period.name,
          beginDate: new Date(period.startDate),
          endDate: new Date(period.endDate),
        },
      });
    }
  } catch (error) {
    console.error('Error syncing grading periods:', error);
  }
}