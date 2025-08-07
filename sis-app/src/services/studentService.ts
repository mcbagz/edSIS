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

  async getStudentEnrollmentHistory(studentId: string) {
    try {
      const response = await api.get(`/students/${studentId}/enrollment-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollment history:', error);
      throw error;
    }
  },

  async updateStudentMedicalInfo(studentId: string, medicalData: {
    conditions?: string;
    medications?: string;
    allergies?: string;
    instructions?: string;
  }) {
    try {
      const response = await api.put(`/students/${studentId}/medical`, medicalData);
      return response.data;
    } catch (error) {
      console.error('Error updating medical information:', error);
      throw error;
    }
  },

  async updateStudentEmergencyContact(studentId: string, contactData: {
    name: string;
    phone: string;
    relationship: string;
  }) {
    try {
      const response = await api.put(`/students/${studentId}/emergency-contact`, contactData);
      return response.data;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw error;
    }
  },

  async addStudentParent(studentId: string, parentData: {
    parentId: string;
    relationship: string;
    isPrimary?: boolean;
    hasLegalCustody?: boolean;
  }) {
    try {
      const response = await api.post(`/students/${studentId}/parents`, parentData);
      return response.data;
    } catch (error) {
      console.error('Error adding parent association:', error);
      throw error;
    }
  },

  async removeStudentParent(studentId: string, parentId: string) {
    try {
      await api.delete(`/students/${studentId}/parents/${parentId}`);
    } catch (error) {
      console.error('Error removing parent association:', error);
      throw error;
    }
  },

  async searchStudents(params: {
    q?: string;
    gradeLevel?: string;
    enrollmentStatus?: string;
    homeroom?: string;
    ethnicity?: string;
    gender?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const response = await api.get('/students/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching students:', error);
      throw error;
    }
  },

  async getStudentCustomFields(studentId: string) {
    try {
      const response = await api.get(`/custom-fields/students/${studentId}/custom-fields`);
      return response.data;
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      throw error;
    }
  },

  async updateStudentCustomFields(studentId: string, fields: Array<{
    fieldId: string;
    value: string;
  }>) {
    try {
      const response = await api.put(`/custom-fields/students/${studentId}/custom-fields`, { fields });
      return response.data;
    } catch (error) {
      console.error('Error updating custom fields:', error);
      throw error;
    }
  },

  // Compatibility methods for Ed-Fi (remove these later)
  async getStudentSchoolAssociations(studentUniqueId: string) {
    // Return empty array for now - this was Ed-Fi specific
    return [];
  },

  async getStudentParentAssociations(studentUniqueId: string) {
    // Return empty array for now - this was Ed-Fi specific
    return [];
  },
};