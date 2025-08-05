export interface Student {
  id: string;
  studentUniqueId: string;
  firstName: string;
  middleName?: string;
  lastSurname: string;
  birthDate: string;
  birthSexDescriptor?: string;
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