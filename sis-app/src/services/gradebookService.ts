import api from './api';

export interface Assignment {
  id: string;
  courseSectionId: string;
  title: string;
  description?: string;
  type: 'Homework' | 'Quiz' | 'Test' | 'Project';
  dueDate: string;
  maxPoints: number;
  weight: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  courseSectionId: string;
  assignmentId?: string;
  gradingPeriodId?: string;
  gradeType: string;
  numericGrade?: number;
  letterGrade?: string;
  points?: number;
  comment?: string;
  student?: any;
  assignment?: Assignment;
  gradingPeriod?: any;
}

export interface GradebookData {
  assignments: Assignment[];
  students: {
    student: any;
    grades: Record<string, Grade | null>;
  }[];
}

export interface WeightedGrade {
  studentId: string;
  courseSectionId: string;
  numericGrade: number;
  letterGrade: string;
  gradesByCategory: Record<string, {
    earned: number;
    possible: number;
    weight: number;
  }>;
}

export interface ReportCard {
  student: any;
  gradingPeriod: any;
  courses: {
    course: any;
    teacher: any;
    numericGrade: number;
    letterGrade: string;
  }[];
  generatedAt: string;
}

export interface GPA {
  studentId: string;
  gpa: number;
  totalCredits: number;
  totalQualityPoints: number;
  scale: string;
}

const gradebookService = {
  // Assignment methods
  async getAssignments(courseSectionId: string): Promise<Assignment[]> {
    const response = await api.get(`/assignments/section/${courseSectionId}`);
    return response.data;
  },

  async getAssignment(id: string): Promise<Assignment & { grades: Grade[] }> {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  async createAssignment(assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment> {
    const response = await api.post('/assignments', assignment);
    return response.data;
  },

  async updateAssignment(id: string, assignment: Partial<Assignment>): Promise<Assignment> {
    const response = await api.put(`/assignments/${id}`, assignment);
    return response.data;
  },

  async deleteAssignment(id: string): Promise<void> {
    await api.delete(`/assignments/${id}`);
  },

  // Grade methods
  async getGrades(params?: {
    courseSectionId?: string;
    studentId?: string;
    assignmentId?: string;
    gradingPeriodId?: string;
  }): Promise<Grade[]> {
    const response = await api.get('/grades', { params });
    return response.data;
  },

  async getStudentGrades(studentId: string, params?: {
    courseSectionId?: string;
    gradingPeriodId?: string;
  }): Promise<Grade[]> {
    const response = await api.get(`/grades/student/${studentId}`, { params });
    return response.data;
  },

  async createGrade(grade: Omit<Grade, 'id'>): Promise<Grade> {
    const response = await api.post('/grades', grade);
    return response.data;
  },

  async updateGrade(id: string, grade: Partial<Grade>): Promise<Grade> {
    const response = await api.put(`/grades/${id}`, grade);
    return response.data;
  },

  async upsertGrade(grade: {
    studentId: string;
    courseSectionId: string;
    assignmentId: string;
    numericGrade?: number;
    letterGrade?: string;
    points?: number;
    comment?: string;
  }): Promise<Grade> {
    const response = await api.post('/grades/upsert', grade);
    return response.data;
  },

  async deleteGrade(id: string): Promise<void> {
    await api.delete(`/grades/${id}`);
  },

  // Gradebook view
  async getGradebook(courseSectionId: string): Promise<GradebookData> {
    const response = await api.get(`/gradebook/${courseSectionId}`);
    return response.data;
  },

  // Calculations
  async calculateWeightedGrade(
    studentId: string, 
    courseSectionId: string,
    gradingPeriodId?: string
  ): Promise<WeightedGrade> {
    const params = gradingPeriodId ? { gradingPeriodId } : undefined;
    const response = await api.get(`/grades/calculate/${studentId}/${courseSectionId}`, { params });
    return response.data;
  },

  async getReportCard(studentId: string, gradingPeriodId: string): Promise<ReportCard> {
    const response = await api.get(`/report-card/${studentId}/${gradingPeriodId}`);
    return response.data;
  },

  async calculateGPA(studentId: string, scale: '4.0' | '5.0' = '4.0'): Promise<GPA> {
    const response = await api.get(`/gpa/${studentId}`, { params: { scale } });
    return response.data;
  }
};

export default gradebookService;