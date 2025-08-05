import api from './api';

export interface Course {
  id: string;
  schoolId: string;
  courseCode: string;
  name: string;
  description?: string;
  credits: number;
  department?: string;
  gradeLevel: string[];
  prerequisites: string[];
  capacity?: number;
  _count?: {
    courseSections: number;
  };
}

export interface CourseSection {
  id: string;
  courseId: string;
  schoolId: string;
  sessionId: string;
  sectionIdentifier: string;
  teacherId: string;
  roomNumber?: string;
  period?: string;
  time?: string;
  days: string[];
  maxStudents: number;
  currentEnrollment: number;
  course?: Course;
  teacher?: any;
  session?: any;
  _count?: {
    enrollments: number;
  };
}

export interface CreateCourseDto {
  schoolId: string;
  courseCode: string;
  name: string;
  description?: string;
  credits: number;
  department?: string;
  gradeLevel: string[];
  prerequisites: string[];
  capacity?: number;
}

export interface CreateSectionDto {
  courseId: string;
  schoolId: string;
  sessionId: string;
  sectionIdentifier: string;
  teacherId: string;
  roomNumber?: string;
  period?: string;
  time?: string;
  days: string[];
  maxStudents: number;
}

// Course APIs
export const getCourses = async (params?: {
  schoolId?: string;
  gradeLevel?: string;
  department?: string;
  search?: string;
}): Promise<Course[]> => {
  const response = await api.get('/courses', { params });
  return response.data;
};

export const getCourse = async (id: string): Promise<Course> => {
  const response = await api.get(`/courses/${id}`);
  return response.data;
};

export const createCourse = async (data: CreateCourseDto): Promise<Course> => {
  const response = await api.post('/courses', data);
  return response.data;
};

export const updateCourse = async (id: string, data: Partial<CreateCourseDto>): Promise<Course> => {
  const response = await api.patch(`/courses/${id}`, data);
  return response.data;
};

export const deleteCourse = async (id: string): Promise<void> => {
  await api.delete(`/courses/${id}`);
};

// Section APIs
export const getSections = async (params?: {
  courseId?: string;
  sessionId?: string;
  teacherId?: string;
  schoolId?: string;
}): Promise<CourseSection[]> => {
  const response = await api.get('/sections', { params });
  return response.data;
};

export const getSection = async (id: string): Promise<CourseSection> => {
  const response = await api.get(`/sections/${id}`);
  return response.data;
};

export const createSection = async (data: CreateSectionDto): Promise<CourseSection> => {
  const response = await api.post('/sections', data);
  return response.data;
};

export const updateSection = async (id: string, data: Partial<CreateSectionDto>): Promise<CourseSection> => {
  const response = await api.patch(`/sections/${id}`, data);
  return response.data;
};

export const deleteSection = async (id: string): Promise<void> => {
  await api.delete(`/sections/${id}`);
};