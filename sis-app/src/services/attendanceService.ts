import api from './api';
import type { AxiosError } from 'axios';

// Attendance-related types
export interface AttendanceCode {
  id: string;
  code: string;
  description: string;
  category: 'present' | 'absent' | 'tardy' | 'excused' | 'unexcused';
  shortcut?: string; // Keyboard shortcut (e.g., 'P' for present)
  isActive: boolean;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  studentName?: string;
  sectionId?: string;
  date: string; // ISO date string
  attendanceCode: string;
  codeId: string;
  recordedBy: string;
  recordedAt?: string;
  comments?: string;
  periodNumber?: number; // For period attendance
}

export interface DailyAttendance {
  date: string;
  studentId: string;
  studentName: string;
  attendanceCode: string;
  codeId: string;
  comments?: string;
}

export interface PeriodAttendance extends DailyAttendance {
  periodNumber: number;
  sectionId: string;
  sectionName?: string;
}

export interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  tardy: number;
  excused: number;
  unexcused: number;
  attendanceRate: number;
}

export interface AttendanceReport {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  stats: AttendanceStats;
  records: AttendanceRecord[];
}

class AttendanceService {
  // Attendance Codes Management
  async getAttendanceCodes(): Promise<AttendanceCode[]> {
    try {
      // In a real implementation, this would fetch from Ed-Fi API
      // For now, return default codes
      return [
        { id: '1', code: 'P', description: 'Present', category: 'present', shortcut: '1', isActive: true },
        { id: '2', code: 'A', description: 'Absent', category: 'absent', shortcut: '2', isActive: true },
        { id: '3', code: 'T', description: 'Tardy', category: 'tardy', shortcut: '3', isActive: true },
        { id: '4', code: 'EA', description: 'Excused Absence', category: 'excused', shortcut: '4', isActive: true },
        { id: '5', code: 'UA', description: 'Unexcused Absence', category: 'unexcused', shortcut: '5', isActive: true },
        { id: '6', code: 'FT', description: 'Field Trip', category: 'excused', shortcut: '6', isActive: true },
      ];
    } catch (error) {
      console.error('Error fetching attendance codes:', error);
      throw error;
    }
  }

  async createAttendanceCode(code: Omit<AttendanceCode, 'id'>): Promise<AttendanceCode> {
    try {
      // Would POST to Ed-Fi API
      const response = await api.post('/attendanceCodes', code);
      return response.data;
    } catch (error) {
      console.error('Error creating attendance code:', error);
      throw error;
    }
  }

  async updateAttendanceCode(id: string, code: Partial<AttendanceCode>): Promise<AttendanceCode> {
    try {
      const response = await api.put(`/attendanceCodes/${id}`, code);
      return response.data;
    } catch (error) {
      console.error('Error updating attendance code:', error);
      throw error;
    }
  }

  async deleteAttendanceCode(id: string): Promise<void> {
    try {
      await api.delete(`/attendanceCodes/${id}`);
    } catch (error) {
      console.error('Error deleting attendance code:', error);
      throw error;
    }
  }

  // Daily Attendance
  async getDailyAttendance(date: string, schoolId?: string, gradeLevel?: string): Promise<DailyAttendance[]> {
    try {
      const params = new URLSearchParams({ date });
      if (schoolId) params.append('schoolId', schoolId);
      if (gradeLevel) params.append('gradeLevel', gradeLevel);

      const response = await api.get(`/studentSectionAttendanceEvents?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily attendance:', error);
      return [];
    }
  }

  async recordDailyAttendance(attendance: DailyAttendance[]): Promise<void> {
    try {
      // Batch record attendance for multiple students
      const promises = attendance.map(record => 
        api.post('/studentSectionAttendanceEvents', {
          studentReference: { studentUniqueId: record.studentId },
          eventDate: record.date,
          attendanceEventCategoryDescriptor: this.mapCodeToDescriptor(record.attendanceCode),
          eventDescription: record.comments
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error recording daily attendance:', error);
      throw error;
    }
  }

  // Period Attendance
  async getPeriodAttendance(date: string, sectionId: string, periodNumber: number): Promise<PeriodAttendance[]> {
    try {
      const params = new URLSearchParams({ 
        date,
        sectionId,
        periodNumber: periodNumber.toString()
      });
      
      const response = await api.get(`/studentSectionAttendanceEvents?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching period attendance:', error);
      return [];
    }
  }

  async recordPeriodAttendance(attendance: PeriodAttendance[]): Promise<void> {
    try {
      const promises = attendance.map(record => 
        api.post('/studentSectionAttendanceEvents', {
          studentReference: { studentUniqueId: record.studentId },
          sectionReference: { sectionIdentifier: record.sectionId },
          eventDate: record.date,
          classPeriodName: `Period ${record.periodNumber}`,
          attendanceEventCategoryDescriptor: this.mapCodeToDescriptor(record.attendanceCode),
          eventDescription: record.comments
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error recording period attendance:', error);
      throw error;
    }
  }

  // Attendance Reports
  async getStudentAttendanceReport(
    studentId: string, 
    startDate: string, 
    endDate: string
  ): Promise<AttendanceReport> {
    try {
      const params = new URLSearchParams({
        studentId,
        beginDate: startDate,
        endDate: endDate
      });

      const response = await api.get(`/studentSectionAttendanceEvents?${params}`);
      const records = response.data;

      // Calculate statistics
      const stats = this.calculateAttendanceStats(records);

      return {
        studentId,
        studentName: '', // Would be fetched from student service
        gradeLevel: '', // Would be fetched from student service
        stats,
        records
      };
    } catch (error) {
      console.error('Error fetching student attendance report:', error);
      throw error;
    }
  }

  async getClassAttendanceReport(
    sectionId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceReport[]> {
    try {
      const params = new URLSearchParams({
        sectionId,
        beginDate: startDate,
        endDate: endDate
      });

      const response = await api.get(`/studentSectionAttendanceEvents?${params}`);
      const records = response.data;

      // Group by student and calculate stats
      const groupedRecords = this.groupRecordsByStudent(records);
      
      return Object.entries(groupedRecords).map(([studentId, studentRecords]) => ({
        studentId,
        studentName: '', // Would be fetched
        gradeLevel: '', // Would be fetched
        stats: this.calculateAttendanceStats(studentRecords),
        records: studentRecords
      }));
    } catch (error) {
      console.error('Error fetching class attendance report:', error);
      throw error;
    }
  }

  // Bulk Operations
  async markBulkAttendance(
    studentIds: string[],
    date: string,
    attendanceCode: string,
    sectionId?: string,
    periodNumber?: number
  ): Promise<void> {
    try {
      const promises = studentIds.map(studentId => {
        const record = {
          studentReference: { studentUniqueId: studentId },
          eventDate: date,
          attendanceEventCategoryDescriptor: this.mapCodeToDescriptor(attendanceCode)
        };

        if (sectionId) {
          Object.assign(record, { sectionReference: { sectionIdentifier: sectionId } });
        }
        if (periodNumber) {
          Object.assign(record, { classPeriodName: `Period ${periodNumber}` });
        }

        return api.post('/studentSectionAttendanceEvents', record);
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking bulk attendance:', error);
      throw error;
    }
  }

  // Helper Methods
  private mapCodeToDescriptor(code: string): string {
    // Map internal codes to Ed-Fi descriptors
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

  private calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
    const stats = {
      totalDays: records.length,
      present: 0,
      absent: 0,
      tardy: 0,
      excused: 0,
      unexcused: 0,
      attendanceRate: 0
    };

    records.forEach(record => {
      switch (record.attendanceCode) {
        case 'P':
          stats.present++;
          break;
        case 'A':
          stats.absent++;
          break;
        case 'T':
          stats.tardy++;
          break;
        case 'EA':
        case 'FT':
          stats.excused++;
          break;
        case 'UA':
          stats.unexcused++;
          break;
      }
    });

    stats.attendanceRate = stats.totalDays > 0 
      ? ((stats.present + stats.tardy) / stats.totalDays) * 100
      : 0;

    return stats;
  }

  private groupRecordsByStudent(records: AttendanceRecord[]): Record<string, AttendanceRecord[]> {
    const grouped: Record<string, AttendanceRecord[]> = {};
    
    records.forEach(record => {
      if (!grouped[record.studentId]) {
        grouped[record.studentId] = [];
      }
      grouped[record.studentId].push(record);
    });

    return grouped;
  }

  // Notification Related
  async getAbsentStudentsForNotification(date: string): Promise<{ studentId: string; guardianEmail?: string }[]> {
    try {
      const params = new URLSearchParams({
        date,
        attendanceCode: 'UA' // Unexcused absences
      });

      const response = await api.get(`/studentSectionAttendanceEvents?${params}`);
      // Would need to join with parent/guardian data
      return response.data;
    } catch (error) {
      console.error('Error fetching absent students:', error);
      return [];
    }
  }
}

export default new AttendanceService();