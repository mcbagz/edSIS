import api from './api';
import type { Student, StudentListResponse, StudentSearchParams } from '../types/student';

export const studentService = {
  async getStudents(params: StudentSearchParams = {}): Promise<StudentListResponse> {
    try {
      // Our backend API will handle the search and pagination
      const response = await api.get('/students', { params });
      
      return {
        students: response.data.students || [],
        totalCount: response.data.totalCount || 0,
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  async getStudent(studentId: string): Promise<Student> {
    try {
      const response = await api.get(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  },

  async getStudentById(studentId: string): Promise<Student> {
    // Alias for getStudent to maintain compatibility
    return this.getStudent(studentId);
  },

  async createStudent(studentData: Partial<Student>): Promise<Student> {
    try {
      const response = await api.post('/students', studentData);
      return response.data;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },

  async updateStudent(studentId: string, studentData: Partial<Student>): Promise<Student> {
    try {
      const response = await api.put(`/students/${studentId}`, studentData);
      return response.data;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    try {
      await api.delete(`/students/${studentId}`);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  // Additional methods for related data
  async getStudentEnrollments(studentId: string) {
    try {
      const response = await api.get(`/enrollment/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      throw error;
    }
  },

  async getStudentGrades(studentId: string) {
    try {
      const response = await api.get(`/students/${studentId}/grades`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student grades:', error);
      throw error;
    }
  },

  async getStudentAttendance(studentId: string) {
    try {
      const response = await api.get(`/students/${studentId}/attendance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      throw error;
    }
  },
};