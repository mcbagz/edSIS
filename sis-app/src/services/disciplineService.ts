import { API_BASE_URL } from '../config';

export interface BehaviorCode {
  code: string;
  description: string;
}

export interface ActionType {
  type: string;
  description: string;
}

export interface DisciplineIncident {
  id: string;
  incidentIdentifier: string;
  incidentDate: string;
  incidentTime?: string;
  incidentLocation?: string;
  reporterName?: string;
  reporterDescription?: string;
  behaviorCode: string;
  incidentDescription: string;
  studentIncidents?: StudentDisciplineIncident[];
  disciplineActions?: DisciplineAction[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentDisciplineIncident {
  id: string;
  studentId: string;
  incidentId: string;
  studentRole: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    gradeLevel: string;
    studentUniqueId: string;
    email?: string;
    phone?: string;
  };
}

export interface DisciplineAction {
  id: string;
  incidentId: string;
  actionType: string;
  actionDate: string;
  duration?: string;
  description?: string;
  assignedBy: string;
}

export interface DisciplineReport {
  startDate?: string;
  endDate?: string;
  groupBy: string;
  totalIncidents: number;
  report: Record<string, {
    count: number;
    incidents: DisciplineIncident[];
  }>;
}

class DisciplineService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getIncidents(params?: {
    studentId?: string;
    startDate?: string;
    endDate?: string;
    behaviorCode?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/discipline/incidents?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch incidents');
    }

    return response.json();
  }

  async getIncidentById(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/incidents/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch incident');
    }

    return response.json();
  }

  async createIncident(incident: Omit<DisciplineIncident, 'id' | 'incidentIdentifier' | 'createdAt' | 'updatedAt'>) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/incidents`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(incident),
    });

    if (!response.ok) {
      throw new Error('Failed to create incident');
    }

    return response.json();
  }

  async updateIncident(id: string, updates: Partial<DisciplineIncident>) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/incidents/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update incident');
    }

    return response.json();
  }

  async deleteIncident(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/incidents/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete incident');
    }

    return response.json();
  }

  async addStudentToIncident(incidentId: string, studentId: string, studentRole: string) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/incidents/${incidentId}/students`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ studentId, studentRole }),
    });

    if (!response.ok) {
      throw new Error('Failed to add student to incident');
    }

    return response.json();
  }

  async removeStudentFromIncident(incidentId: string, studentId: string) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/incidents/${incidentId}/students/${studentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to remove student from incident');
    }

    return response.json();
  }

  async addDisciplineAction(incidentId: string, action: Omit<DisciplineAction, 'id' | 'incidentId'>) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/incidents/${incidentId}/actions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      throw new Error('Failed to add discipline action');
    }

    return response.json();
  }

  async updateDisciplineAction(actionId: string, updates: Partial<DisciplineAction>) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/actions/${actionId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update discipline action');
    }

    return response.json();
  }

  async deleteDisciplineAction(actionId: string) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/actions/${actionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete discipline action');
    }

    return response.json();
  }

  async getStudentDisciplineHistory(studentId: string) {
    const response = await fetch(`${API_BASE_URL}/api/discipline/students/${studentId}/history`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student discipline history');
    }

    return response.json();
  }

  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }): Promise<DisciplineReport> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/discipline/report?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    return response.json();
  }

  async getBehaviorCodes(): Promise<BehaviorCode[]> {
    const response = await fetch(`${API_BASE_URL}/api/discipline/behavior-codes`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch behavior codes');
    }

    return response.json();
  }

  async getActionTypes(): Promise<ActionType[]> {
    const response = await fetch(`${API_BASE_URL}/api/discipline/action-types`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch action types');
    }

    return response.json();
  }
}

export const disciplineService = new DisciplineService();