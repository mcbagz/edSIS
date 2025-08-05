import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authService } from '../services/authService';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const COOKIE_OPTIONS = {
  secure: window.location.protocol === 'https:', // Only secure in production
  sameSite: 'strict' as const,
  expires: 7, // 7 days
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = Cookies.get('accessToken');
      const refreshTokenValue = Cookies.get('refreshToken');

      if (accessToken) {
        try {
          // Verify the access token
          const payload = await authService.verifyAccessToken(accessToken);
          
          // Get user data from token
          const userData: User = {
            id: payload.sub,
            email: payload.email,
            firstName: payload.email.split('@')[0],
            lastName: 'User',
            role: payload.role,
          };
          
          setUser(userData);
        } catch (error) {
          // Access token invalid, try refresh
          if (refreshTokenValue) {
            try {
              await refreshTokenInternal();
            } catch (refreshError) {
              // Both tokens invalid, clear session
              clearSession();
            }
          } else {
            clearSession();
          }
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const clearSession = () => {
    setUser(null);
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  };

  const refreshTokenInternal = async () => {
    const refreshTokenValue = Cookies.get('refreshToken');
    
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      const tokens = await authService.refreshTokens(refreshTokenValue);
      
      // Store new tokens
      Cookies.set('accessToken', tokens.accessToken, COOKIE_OPTIONS);
      Cookies.set('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      
      // Get user data from new token
      const payload = await authService.verifyAccessToken(tokens.accessToken);
      const userData: User = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.email.split('@')[0],
        lastName: 'User',
        role: payload.role,
      };
      
      setUser(userData);
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { user, tokens } = await authService.login(email, password);
      
      // Store tokens in secure cookies
      Cookies.set('accessToken', tokens.accessToken, COOKIE_OPTIONS);
      Cookies.set('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      
      setUser(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid credentials';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, []);

  const refreshToken = useCallback(async () => {
    await refreshTokenInternal();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!user) return;

    // Refresh token 1 minute before it expires (14 minutes)
    const refreshInterval = setInterval(async () => {
      try {
        await refreshTokenInternal();
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    error,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};