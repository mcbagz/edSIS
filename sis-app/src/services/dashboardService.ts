import { API_BASE_URL } from '../config';

export interface DashboardStats {
  // Admin stats
  totalStudents?: number;
  totalStaff?: number;
  attendanceToday?: string;
  activeCourses?: number;
  
  // Teacher stats
  myStudents?: number;
  classesToday?: number;
  assignmentsDue?: number;
  attendanceRate?: string;
  
  // Parent stats
  myChildren?: number;
  upcomingEvents?: number;
  averageGrade?: string;
  
  // Student stats
  myCourses?: number;
  attendance?: string;
  currentGPA?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'normal' | 'high';
}

export interface Event {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'deadline' | 'event' | 'academic';
  description?: string;
}

class DashboardService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard statistics');
    }

    return response.json();
  }

  async getAnnouncements(): Promise<Announcement[]> {
    const response = await fetch(`${API_BASE_URL}/dashboard/announcements`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }

    return response.json();
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const response = await fetch(`${API_BASE_URL}/dashboard/events`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch upcoming events');
    }

    return response.json();
  }
}

export const dashboardService = new DashboardService();