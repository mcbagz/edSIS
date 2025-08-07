export interface Student {
  id: string;
  studentId?: string;  // Alternative ID field
  studentUniqueId: string;
  firstName: string;
  middleName?: string;
  lastName?: string;  // Alternative to lastSurname
  lastSurname: string;
  birthDate: string;
  birthSexDescriptor?: string;
  gradeLevel?: string;
  enrollmentStatus?: string;
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