export interface Student {
  id: string;
  studentId?: string;  // Alternative ID field
  studentUniqueId: string;
  firstName: string;
  middleName?: string;
  lastName?: string;  // Alternative to lastSurname
  lastSurname: string;
  birthDate: string;
  birthSex?: string;  // Gender field
  birthSexDescriptor?: string;  // Legacy field
  gender?: string;
  ethnicity?: string;
  gradeLevel?: string;
  enrollmentDate?: string;
  enrollmentStatus?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  homeroom?: {
    name: string;
    teacher: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  medical?: {
    conditions?: string;
    medications?: string;
    allergies?: string;
    instructions?: string;
  };
  parents?: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    relationship?: string;
    isPrimary?: boolean;
  }>;
  enrollments?: Array<{
    id: string;
    status: string;
    enrollmentDate: string;
    courseSection?: {
      id: string;
      sectionIdentifier?: string;
      course?: {
        courseName: string;
      };
      teacher?: {
        firstName: string;
        lastName: string;
      };
    };
    homeroom?: {
      id: string;
      name: string;
      school?: {
        name: string;
      };
      teacher: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
  recentAttendance?: Array<{
    id: string;
    date: string;
    status: string;
  }>;
  recentGrades?: Array<{
    id: string;
    numericGrade?: number;
    letterGrade?: string;
    assignment?: {
      title: string;
    };
    courseSection?: {
      course?: {
        courseName: string;
      };
    };
  }>;
  studentIdentificationCodes?: Array<{
    assigningOrganizationIdentificationCode: string;
    identificationCode: string;
    studentIdentificationSystemDescriptor: string;
  }>;
}

export interface StudentListResponse {
  students: Student[];
  totalCount: number;
}

export interface StudentSearchParams {
  q?: string;
  gradeLevel?: string;
  enrollmentStatus?: string;
  limit?: number;
  offset?: number;
}