import api from './api';

export interface School {
  id: string;
  schoolId: number;
  name: string;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  principal?: string;
}

export interface Session {
  id: string;
  schoolId: string;
  name: string;
  beginDate: string;
  endDate: string;
  totalInstructionalDays: number;
  school?: School;
}

export const getSchools = async (): Promise<School[]> => {
  const response = await api.get('/schools');
  return response.data;
};

export const getSessions = async (schoolId?: string): Promise<Session[]> => {
  const params = schoolId ? { schoolId } : {};
  const response = await api.get('/sessions', { params });
  return response.data;
};

export const getCurrentSession = async (schoolId?: string): Promise<Session | null> => {
  const params = schoolId ? { schoolId } : {};
  const response = await api.get('/sessions/current', { params });
  return response.data;
};