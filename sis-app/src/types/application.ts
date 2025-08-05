export interface ProspectiveStudent {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  ethnicity?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianRelation: string;
}

export interface Application {
  id: string;
  prospectiveStudentId: string;
  status: 'APPLIED' | 'ACCEPTED' | 'REJECTED';
  applicationDate: string;
  documents?: Record<string, any>;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  acceptanceEmailSent: boolean;
  createdAt: string;
  updatedAt: string;
  prospectiveStudent: ProspectiveStudent;
}

export interface ApplicationListResponse {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentUploadResponse {
  uploadUrl: string;
  key: string;
}