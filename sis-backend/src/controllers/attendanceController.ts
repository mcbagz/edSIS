import type { Request, Response } from 'express';
import axios from 'axios';
import https from 'https';
import notificationService from '../utils/notificationService';

// Configure axios to accept self-signed certificates for development
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const ED_FI_API_BASE = process.env.ED_FI_API_BASE || 'https://localhost/api/data/v3';
const ED_FI_API_KEY = process.env.ED_FI_API_KEY || '';
const ED_FI_API_SECRET = process.env.ED_FI_API_SECRET || '';

let accessToken: string | null = null;
let tokenExpiry: Date | null = null;

// Helper function to get OAuth token from Ed-Fi
const getEdFiToken = async (): Promise<string> => {
  // Check if we have a valid token
  if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
    return accessToken;
  }

  try {
    // Get new token
    const tokenUrl = process.env.EDFI_API_BASE_URL + '/oauth/token';
    const response = await axios.post(tokenUrl, 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${ED_FI_API_KEY}:${ED_FI_API_SECRET}`).toString('base64')
        }
      }
    );

    const data = response.data as { access_token: string; expires_in?: number };
    accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    const expiresIn = data.expires_in || 3600;
    tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
    
    return accessToken || '';
  } catch (error: any) {
    console.error('Error getting Ed-Fi token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Ed-Fi API');
  }
};

// Helper function to get Ed-Fi API headers with auth
const getEdFiHeaders = async () => {
  const token = await getEdFiToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to make Ed-Fi API requests
const edFiAxios = {
  get: async (url: string, config?: any) => {
    return axios.get(url, { ...config, httpsAgent });
  },
  post: async (url: string, data?: any, config?: any) => {
    return axios.post(url, data, { ...config, httpsAgent });
  }
};

// Get attendance codes
export const getAttendanceCodes = async (req: Request, res: Response) => {
  try {
    // For now, return default attendance codes
    // In production, these would be stored in Ed-Fi or a local database
    const codes = [
      { id: '1', code: 'P', description: 'Present', category: 'present', shortcut: '1', isActive: true },
      { id: '2', code: 'A', description: 'Absent', category: 'absent', shortcut: '2', isActive: true },
      { id: '3', code: 'T', description: 'Tardy', category: 'tardy', shortcut: '3', isActive: true },
      { id: '4', code: 'EA', description: 'Excused Absence', category: 'excused', shortcut: '4', isActive: true },
      { id: '5', code: 'UA', description: 'Unexcused Absence', category: 'unexcused', shortcut: '5', isActive: true },
      { id: '6', code: 'FT', description: 'Field Trip', category: 'excused', shortcut: '6', isActive: true },
    ];
    res.json(codes);
  } catch (error) {
    console.error('Error fetching attendance codes:', error);
    res.status(500).json({ error: 'Failed to fetch attendance codes' });
  }
};

// Create attendance code
export const createAttendanceCode = async (req: Request, res: Response) => {
  try {
    const { code, description, category, shortcut, isActive } = req.body;
    
    // In production, this would be stored in Ed-Fi or a local database
    const newCode = {
      id: Date.now().toString(),
      code,
      description,
      category,
      shortcut,
      isActive
    };
    
    res.status(201).json(newCode);
  } catch (error) {
    console.error('Error creating attendance code:', error);
    res.status(500).json({ error: 'Failed to create attendance code' });
  }
};

// Update attendance code
export const updateAttendanceCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // In production, this would update the code in the database
    const updatedCode = {
      id,
      ...updates
    };
    
    res.json(updatedCode);
  } catch (error) {
    console.error('Error updating attendance code:', error);
    res.status(500).json({ error: 'Failed to update attendance code' });
  }
};

// Delete attendance code
export const deleteAttendanceCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // In production, this would delete from the database
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting attendance code:', error);
    res.status(500).json({ error: 'Failed to delete attendance code' });
  }
};

// Get daily attendance
export const getDailyAttendance = async (req: Request, res: Response) => {
  try {
    const { date, schoolId, gradeLevel } = req.query;
    
    // Fetch attendance events from Ed-Fi
    const response = await edFiAxios.get(
      `${ED_FI_API_BASE}/studentSchoolAttendanceEvents`,
      {
        headers: await getEdFiHeaders(),
        params: {
          eventDate: date,
          ...(schoolId && { schoolId }),
        }
      }
    );

    // Transform Ed-Fi response to our format
    const data = response.data as any[];
    const attendance = data.map((event: any) => ({
      studentId: event.studentReference?.studentUniqueId,
      studentName: `${event.studentReference?.firstName || ''} ${event.studentReference?.lastName || ''}`.trim(),
      date: event.eventDate,
      attendanceCode: mapDescriptorToCode(event.attendanceEventCategoryDescriptor),
      codeId: getCodeIdFromDescriptor(event.attendanceEventCategoryDescriptor),
      comments: event.eventDescription
    }));

    // Filter by grade level if specified
    let filteredAttendance = attendance;
    if (gradeLevel && gradeLevel !== 'all') {
      // Would need to join with student data to filter by grade
      // For now, return all
    }

    res.json(filteredAttendance);
  } catch (error: any) {
    console.error('Error fetching daily attendance:', error.response?.data || error.message);
    res.json([]); // Return empty array if no data
  }
};

// Record daily attendance
export const recordDailyAttendance = async (req: Request, res: Response) => {
  try {
    const attendanceRecords = req.body;
    
    const promises = attendanceRecords.map(async (record: any) => {
      const payload = {
        studentReference: {
          studentUniqueId: record.studentId
        },
        schoolReference: {
          schoolId: 255901001 // Default school ID - should be dynamic
        },
        sessionReference: {
          schoolId: 255901001,
          sessionName: "2024-2025 School Year",
          schoolYear: 2025
        },
        eventDate: record.date,
        attendanceEventCategoryDescriptor: mapCodeToDescriptor(record.attendanceCode),
        eventDescription: record.comments
      };

      return edFiAxios.post(
        `${ED_FI_API_BASE}/studentSchoolAttendanceEvents`,
        payload,
        { headers: await getEdFiHeaders() }
      ).catch((err: any) => {
        console.error('Error recording attendance for student:', record.studentId, err.response?.data);
        return null;
      });
    });

    await Promise.all(promises);
    
    // Send notifications for absences and tardies
    const notificationSettings = await notificationService.getNotificationSettings();
    if (notificationSettings.attendanceAlertsEnabled) {
      const notificationsToSend = attendanceRecords
        .filter((record: any) => ['A', 'UA', 'T'].includes(record.attendanceCode))
        .map((record: any) => ({
          studentId: record.studentId,
          studentName: record.studentName || 'Student',
          attendanceCode: record.attendanceCode,
          date: record.date,
        }));
      
      if (notificationsToSend.length > 0) {
        // Send notifications asynchronously without blocking the response
        notificationService.sendBulkAttendanceAlerts(notificationsToSend).catch(err => {
          console.error('Error sending attendance notifications:', err);
        });
      }
    }
    
    res.json({ success: true, message: 'Attendance recorded successfully' });
  } catch (error: any) {
    console.error('Error recording daily attendance:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
};

// Get period attendance
export const getPeriodAttendance = async (req: Request, res: Response) => {
  try {
    const { date, sectionId, periodNumber } = req.query;
    
    // Fetch section attendance events from Ed-Fi
    const response = await edFiAxios.get(
      `${ED_FI_API_BASE}/studentSectionAttendanceEvents`,
      {
        headers: await getEdFiHeaders(),
        params: {
          eventDate: date,
          sectionIdentifier: sectionId,
        }
      }
    );

    // Transform and filter by period if needed
    const data = response.data as any[];
    const attendance = data
      .filter((event: any) => !periodNumber || event.classPeriodName === `Period ${periodNumber}`)
      .map((event: any) => ({
        studentId: event.studentReference?.studentUniqueId,
        studentName: `${event.studentReference?.firstName || ''} ${event.studentReference?.lastName || ''}`.trim(),
        sectionId: event.sectionReference?.sectionIdentifier,
        date: event.eventDate,
        periodNumber: extractPeriodNumber(event.classPeriodName),
        attendanceCode: mapDescriptorToCode(event.attendanceEventCategoryDescriptor),
        codeId: getCodeIdFromDescriptor(event.attendanceEventCategoryDescriptor),
        comments: event.eventDescription
      }));

    res.json(attendance);
  } catch (error: any) {
    console.error('Error fetching period attendance:', error.response?.data || error.message);
    res.json([]); // Return empty array if no data
  }
};

// Record period attendance
export const recordPeriodAttendance = async (req: Request, res: Response) => {
  try {
    const attendanceRecords = req.body;
    
    const promises = attendanceRecords.map(async (record: any) => {
      const payload = {
        studentReference: {
          studentUniqueId: record.studentId
        },
        sectionReference: {
          localCourseCode: record.sectionId,
          schoolId: 255901001,
          schoolYear: 2025,
          sessionName: "2024-2025 School Year",
          sectionIdentifier: record.sectionId
        },
        eventDate: record.date,
        classPeriodName: `Period ${record.periodNumber}`,
        attendanceEventCategoryDescriptor: mapCodeToDescriptor(record.attendanceCode),
        eventDescription: record.comments
      };

      return edFiAxios.post(
        `${ED_FI_API_BASE}/studentSectionAttendanceEvents`,
        payload,
        { headers: await getEdFiHeaders() }
      ).catch((err: any) => {
        console.error('Error recording period attendance:', err.response?.data);
        return null;
      });
    });

    await Promise.all(promises);
    
    // Send notifications for period absences and tardies
    const notificationSettings = await notificationService.getNotificationSettings();
    if (notificationSettings.attendanceAlertsEnabled) {
      const notificationsToSend = attendanceRecords
        .filter((record: any) => ['A', 'UA', 'T'].includes(record.attendanceCode))
        .map((record: any) => ({
          studentId: record.studentId,
          studentName: record.studentName || 'Student',
          attendanceCode: record.attendanceCode,
          date: record.date,
        }));
      
      if (notificationsToSend.length > 0) {
        // Send notifications asynchronously without blocking the response
        notificationService.sendBulkAttendanceAlerts(notificationsToSend).catch(err => {
          console.error('Error sending period attendance notifications:', err);
        });
      }
    }
    
    res.json({ success: true, message: 'Period attendance recorded successfully' });
  } catch (error: any) {
    console.error('Error recording period attendance:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to record period attendance' });
  }
};

// Get student attendance report
export const getStudentAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { studentId, beginDate, endDate } = req.query;
    
    // Fetch all attendance events for the student in date range
    const response = await edFiAxios.get(
      `${ED_FI_API_BASE}/studentSchoolAttendanceEvents`,
      {
        headers: await getEdFiHeaders(),
        params: {
          studentUniqueId: studentId,
          minEventDate: beginDate,
          maxEventDate: endDate
        }
      }
    );

    const eventData = response.data as any[];
    const records = eventData.map((event: any) => ({
      studentId: event.studentReference?.studentUniqueId,
      date: event.eventDate,
      attendanceCode: mapDescriptorToCode(event.attendanceEventCategoryDescriptor),
      codeId: getCodeIdFromDescriptor(event.attendanceEventCategoryDescriptor),
      comments: event.eventDescription
    }));

    // Calculate statistics
    const stats = {
      totalDays: records.length,
      present: records.filter((r: any) => r.attendanceCode === 'P').length,
      absent: records.filter((r: any) => r.attendanceCode === 'A').length,
      tardy: records.filter((r: any) => r.attendanceCode === 'T').length,
      excused: records.filter((r: any) => ['EA', 'FT'].includes(r.attendanceCode)).length,
      unexcused: records.filter((r: any) => r.attendanceCode === 'UA').length,
      attendanceRate: 0
    };

    stats.attendanceRate = stats.totalDays > 0 
      ? ((stats.present + stats.tardy) / stats.totalDays) * 100
      : 0;

    res.json({
      studentId,
      studentName: '', // Would need to fetch from student service
      gradeLevel: '', // Would need to fetch from student service
      stats,
      records
    });
  } catch (error: any) {
    console.error('Error fetching student attendance report:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch attendance report' });
  }
};

// Get class attendance report
export const getClassAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { sectionId, beginDate, endDate } = req.query;
    
    // Fetch section attendance events
    const response = await edFiAxios.get(
      `${ED_FI_API_BASE}/studentSectionAttendanceEvents`,
      {
        headers: await getEdFiHeaders(),
        params: {
          sectionIdentifier: sectionId,
          minEventDate: beginDate,
          maxEventDate: endDate
        }
      }
    );

    // Group by student
    const studentRecords: Record<string, any[]> = {};
    const sectionData = response.data as any[];
    sectionData.forEach((event: any) => {
      const studentId = event.studentReference?.studentUniqueId;
      if (!studentRecords[studentId]) {
        studentRecords[studentId] = [];
      }
      studentRecords[studentId].push({
        studentId,
        date: event.eventDate,
        attendanceCode: mapDescriptorToCode(event.attendanceEventCategoryDescriptor),
        codeId: getCodeIdFromDescriptor(event.attendanceEventCategoryDescriptor),
        comments: event.eventDescription
      });
    });

    // Calculate stats for each student
    const reports = Object.entries(studentRecords).map(([studentId, records]) => {
      const stats = {
        totalDays: records.length,
        present: records.filter(r => r.attendanceCode === 'P').length,
        absent: records.filter(r => r.attendanceCode === 'A').length,
        tardy: records.filter(r => r.attendanceCode === 'T').length,
        excused: records.filter(r => ['EA', 'FT'].includes(r.attendanceCode)).length,
        unexcused: records.filter(r => r.attendanceCode === 'UA').length,
        attendanceRate: 0
      };

      stats.attendanceRate = stats.totalDays > 0 
        ? ((stats.present + stats.tardy) / stats.totalDays) * 100
        : 0;

      return {
        studentId,
        studentName: '', // Would need to fetch
        gradeLevel: '', // Would need to fetch
        stats,
        records
      };
    });

    res.json(reports);
  } catch (error: any) {
    console.error('Error fetching class attendance report:', error.response?.data || error.message);
    res.json([]); // Return empty array if no data
  }
};

// Helper functions
function mapCodeToDescriptor(code: string): string {
  const codeMap: Record<string, string> = {
    'P': 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#In Attendance',
    'A': 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Absence',
    'T': 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Tardy',
    'EA': 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Excused Absence',
    'UA': 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Unexcused Absence',
    'FT': 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Excused Absence'
  };
  return codeMap[code] || 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#In Attendance';
}

function mapDescriptorToCode(descriptor: string): string {
  if (descriptor?.includes('In Attendance')) return 'P';
  if (descriptor?.includes('Tardy')) return 'T';
  if (descriptor?.includes('Unexcused Absence')) return 'UA';
  if (descriptor?.includes('Excused Absence')) return 'EA';
  if (descriptor?.includes('Absence')) return 'A';
  return 'P';
}

function getCodeIdFromDescriptor(descriptor: string): string {
  const code = mapDescriptorToCode(descriptor);
  const codeIdMap: Record<string, string> = {
    'P': '1',
    'A': '2',
    'T': '3',
    'EA': '4',
    'UA': '5',
    'FT': '6'
  };
  return codeIdMap[code] || '1';
}

function extractPeriodNumber(classPeriodName: string): number {
  const match = classPeriodName?.match(/Period (\d+)/);
  return match ? parseInt(match[1]) : 1;
}