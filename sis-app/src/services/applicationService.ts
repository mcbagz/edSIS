import api from './api';
import type { 
  Application, 
  ApplicationListResponse, 
  ProspectiveStudent,
  DocumentUploadResponse 
} from '../types/application';

export const applicationService = {
  // List applications with pagination and filtering
  async listApplications(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApplicationListResponse> {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  // Get single application
  async getApplication(id: string): Promise<Application> {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  // Create new application
  async createApplication(data: {
    prospectiveStudent: ProspectiveStudent;
    notes?: string;
  }): Promise<Application> {
    const response = await api.post('/applications', data);
    return response.data;
  },


  // Get presigned URL for document upload
  async getUploadUrl(applicationId: string, documentType: string): Promise<DocumentUploadResponse> {
    const response = await api.post('/applications/upload-url', {
      applicationId,
      documentType,
    });
    return response.data;
  },

  // Upload document to S3 using presigned URL
  async uploadDocument(uploadUrl: string, file: File): Promise<void> {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  },

  // Update application documents metadata
  async updateDocuments(id: string, documents: Record<string, any>): Promise<Application> {
    const response = await api.patch(`/applications/${id}/documents`, { documents });
    return response.data;
  },

  // Process accepted application (trigger student creation)
  async processAcceptedApplication(applicationId: string): Promise<void> {
    await api.post('/webhooks/process-accepted-application', { applicationId });
  },

  // Get application by ID (alias for getApplication for consistency)
  async getApplicationById(id: string): Promise<Application> {
    return this.getApplication(id);
  },

  // Update application status with notes
  async updateApplicationStatus(
    id: string,
    data: { status: string; notes?: string }
  ): Promise<Application> {
    const response = await api.patch(`/applications/${id}/status`, data);
    return response.data;
  },

  // Update application notes
  async updateApplicationNotes(id: string, notes: string): Promise<Application> {
    const response = await api.patch(`/applications/${id}/notes`, { notes });
    return response.data;
  },

  // Send acceptance email
  async sendAcceptanceEmail(id: string): Promise<void> {
    const response = await api.post(`/applications/${id}/send-acceptance-email`);
    return response.data;
  },
};