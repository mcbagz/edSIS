import api from './api';

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