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
  course: Course;
  teacher: {
    firstName: string;
    lastName: string;
  };
}

export interface AvailableCourse {
  course: Course;
  sections: {
    id: string;
    sectionIdentifier: string;
    teacher: string;
    time?: string;
    days: string[];
    roomNumber?: string;
    availableSeats: number;
  }[];
}

export interface Homeroom {
  id: string;
  name: string;
  teacher: string;
  roomNumber?: string;
  availableSeats: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseSectionId?: string;
  homeroomId?: string;
  enrollmentDate: string;
  exitDate?: string;
  status: string;
  grade?: string;
  courseSection?: CourseSection;
  homeroom?: {
    id: string;
    name: string;
    teacher: {
      firstName: string;
      lastName: string;
    };
    roomNumber?: string;
  };
}

export interface EnrollmentFormData {
  studentId: string;
  courseSectionIds: string[];
  homeroomId: string;
}

export interface TimeConflict {
  section1: string;
  section2: string;
  conflictingDays: string[];
  period: string;
}