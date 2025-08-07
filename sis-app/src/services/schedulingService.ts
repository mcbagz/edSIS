import api from './api';

export interface Section {
  id: string;
  sectionName: string;
  sectionIdentifier: string;
  courseCode: string;
  courseName: string;
  courseId: string;
  teacherId?: string;
  teacherName?: string;
  roomNumber?: string;
  sessionId: string;
  sessionName?: string;
  days: string[];
  period?: string;
  startTime?: string;
  endTime?: string;
  maxStudents: number;
  enrolledCount?: number;
  credits?: number;
}

export interface SectionEnrollment {
  studentId: string;
  studentName: string;
  gradeLevel?: string;
  enrollmentDate?: string;
}

export interface ScheduleConflict {
  sectionA: {
    id: string;
    courseName: string;
    sectionIdentifier: string;
    days: string[];
    time?: string;
    period?: string;
  };
  sectionB: {
    id: string;
    courseName: string;
    sectionIdentifier: string;
    days: string[];
    time?: string;
    period?: string;
  };
}

export interface TeacherSchedule {
  teacherId: string;
  sessionId?: string;
  sections: Array<{
    id: string;
    courseCode: string;
    courseName: string;
    sectionIdentifier: string;
    roomNumber?: string;
    period?: string;
    time?: string;
    days: string[];
    sessionName: string;
    enrollmentCount: number;
    maxStudents: number;
  }>;
}

export interface StudentSchedule {
  studentId: string;
  sessionId?: string;
  sections: Array<{
    id: string;
    courseCode: string;
    courseName: string;
    sectionIdentifier: string;
    teacherName: string;
    roomNumber?: string;
    period?: string;
    time?: string;
    days: string[];
    sessionName: string;
    credits: number;
  }>;
}

export interface GenerateScheduleDto {
  studentId: string;
  courseIds: string[];
  sessionId: string;
}

export interface GenerateScheduleResponse {
  success: boolean;
  message?: string;
  sectionIds?: string[];
  conflicts?: string[];
}

// Check for schedule conflicts
export const checkConflicts = async (sectionIds: string[]): Promise<{
  hasConflicts: boolean;
  conflicts: ScheduleConflict[];
}> => {
  const response = await api.post('/scheduling/check-conflicts', { sectionIds });
  return response.data;
};

// Get teacher's schedule
export const getTeacherSchedule = async (
  teacherId: string,
  sessionId?: string
): Promise<TeacherSchedule> => {
  const params = sessionId ? { sessionId } : {};
  const response = await api.get(`/scheduling/teacher/${teacherId}`, { params });
  return response.data;
};

// Get student's schedule
export const getStudentSchedule = async (
  studentId: string,
  sessionId?: string
): Promise<StudentSchedule> => {
  const params = sessionId ? { sessionId } : {};
  const response = await api.get(`/scheduling/student/${studentId}`, { params });
  return response.data;
};

// Generate automatic schedule for student
export const generateSchedule = async (
  data: GenerateScheduleDto
): Promise<GenerateScheduleResponse> => {
  const response = await api.post('/scheduling/generate', data);
  return response.data;
};

// Check teacher availability
export const checkTeacherAvailability = async (data: {
  teacherId: string;
  days: string[];
  time?: string;
  period?: string;
  sessionId: string;
  excludeSectionId?: string;
}): Promise<{ available: boolean }> => {
  const response = await api.post('/scheduling/check-teacher-availability', data);
  return response.data;
};

// Check room availability
export const checkRoomAvailability = async (data: {
  roomNumber: string;
  days: string[];
  time?: string;
  period?: string;
  sessionId: string;
  excludeSectionId?: string;
}): Promise<{ available: boolean }> => {
  const response = await api.post('/scheduling/check-room-availability', data);
  return response.data;
};

// Get all sections
export const getSections = async (params?: {
  sessionId?: string;
  courseId?: string;
  teacherId?: string;
}): Promise<Section[]> => {
  try {
    const response = await api.get('/sections', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
};

// Get section enrollment
export const getSectionEnrollment = async (sectionId: string): Promise<SectionEnrollment[]> => {
  try {
    const response = await api.get(`/studentSectionAssociations?sectionReference.sectionIdentifier=${sectionId}`);
    // Transform the Ed-Fi response to our format
    const enrollments = response.data.map((assoc: any) => ({
      studentId: assoc.studentReference?.studentUniqueId || '',
      studentName: `${assoc.studentReference?.firstName || ''} ${assoc.studentReference?.lastName || ''}`.trim(),
      gradeLevel: assoc.studentReference?.gradeLevel || '',
      enrollmentDate: assoc.beginDate
    }));
    return enrollments;
  } catch (error) {
    console.error('Error fetching section enrollment:', error);
    return [];
  }
};

// Export as an object for consistency with other services
const schedulingService = {
  checkConflicts,
  getTeacherSchedule,
  getStudentSchedule,  
  generateSchedule,
  checkTeacherAvailability,
  checkRoomAvailability,
  getSections,
  getSectionEnrollment
};

export default schedulingService;