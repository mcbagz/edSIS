import api from './api';

export interface Staff {
  id: string;
  userId: string;
  staffUniqueId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  hireDate: string;
  user?: {
    email: string;
    role: string;
    isActive: boolean;
  };
}

export const getStaff = async (params?: {
  position?: string;
  department?: string;
}): Promise<Staff[]> => {
  const response = await api.get('/staff', { params });
  return response.data;
};

export const getStaffMember = async (id: string): Promise<Staff> => {
  const response = await api.get(`/staff/${id}`);
  return response.data;
};

export const createStaff = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  position: string;
  department?: string;
  hireDate: string;
}): Promise<Staff> => {
  const response = await api.post('/staff', data);
  return response.data;
};

export const updateStaff = async (id: string, data: Partial<Staff>): Promise<Staff> => {
  const response = await api.put(`/staff/${id}`, data);
  return response.data;
};

export const deleteStaff = async (id: string): Promise<void> => {
  await api.delete(`/staff/${id}`);
};

export const getStaffSchedule = async (id: string): Promise<any> => {
  const response = await api.get(`/staff/${id}/schedule`);
  return response.data;
};

export const getStaffStats = async (): Promise<any> => {
  const response = await api.get('/staff/stats');
  return response.data;
};