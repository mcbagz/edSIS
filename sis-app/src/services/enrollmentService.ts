import api from './api';
import type { 
  AvailableCourse, 
  Homeroom, 
  Enrollment,
  EnrollmentFormData 
} from '../types/enrollment';

export const enrollmentService = {
  // Get available courses for enrollment
  async getAvailableCourses(gradeLevel: string, sessionId: string): Promise<AvailableCourse[]> {
    const response = await api.get('/enrollment/courses', {
      params: { gradeLevel, sessionId },
    });
    return response.data;
  },

  // Get available homerooms
  async getAvailableHomerooms(gradeLevel: string): Promise<Homeroom[]> {
    const response = await api.get('/enrollment/homerooms', {
      params: { gradeLevel },
    });
    return response.data;
  },

  // Get student's current enrollments
  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    const response = await api.get(`/enrollment/student/${studentId}`);
    return response.data;
  },

  // Enroll student in courses and homeroom
  async enrollStudent(data: EnrollmentFormData): Promise<{
    message: string;
    enrollments: Enrollment[];
  }> {
    const response = await api.post('/enrollment', data);
    return response.data;
  },

  // Drop a course
  async dropCourse(enrollmentId: string): Promise<{ message: string }> {
    const response = await api.delete(`/enrollment/${enrollmentId}`);
    return response.data;
  },
};