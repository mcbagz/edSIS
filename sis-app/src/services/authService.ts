import api from './api';
import type { User, UserRole } from '../types/auth';
import Cookies from 'js-cookie';

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    studentId?: string;
    staffId?: string;
    parentId?: string;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;

      // Store token in both cookie and localStorage
      Cookies.set('accessToken', token, { expires: 1 }); // 1 day
      localStorage.setItem('accessToken', token);

      return {
        user: user as User,
        tokens: {
          accessToken: token,
          expiresIn: 24 * 60 * 60, // 24 hours in seconds
        },
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid credentials');
      } else if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get current user');
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      // Clear tokens
      Cookies.remove('accessToken');
      localStorage.removeItem('accessToken');
      
      // Redirect to login
      window.location.href = '/login';
    }
  },

  async verifyAccessToken(token: string): Promise<any> {
    // In a real implementation, this would decode the JWT
    // For now, we'll rely on the backend to validate tokens
    try {
      // Make a request to verify the token is still valid
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  },

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};