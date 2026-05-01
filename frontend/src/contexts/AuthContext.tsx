'use client';

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl, parseJsonResponse, getAuthToken, setAuthToken, clearAuthToken } from '@/lib/api';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'client' | 'artist' | 'admin';
  status?: 'active' | 'pending' | 'suspended';
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<{ user: User }>;
  isAuthenticated: boolean;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'client' | 'artist';
  phone?: string;
  bio?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (input: User): User => ({
  ...input,
  _id: input._id || input.id,
  id: input.id || input._id,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();

        if (!token) {
          setLoading(false);
          return;
        }

        console.log('[Auth] checkAuth token:', token);

        const apiUrl = getApiBaseUrl();
        const response = await fetch(`${apiUrl}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('[Auth] checkAuth response status:', response.status);
        const data = await parseJsonResponse<{ user: User } | null>(response);
        console.log('[Auth] checkAuth response payload:', data);

        if (!data?.user) {
          console.log('User not found, logging out');
          clearAuthToken();
          setUser(null);
          router.push('/sign-in');
          return;
        }

        setUser(normalizeUser(data.user));
      } catch (error) {
        console.error('Auth check failed:', error);
        clearAuthToken();
        setUser(null);
        router.push('/sign-in');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      const apiUrl = getApiBaseUrl();
      console.log(`[Auth] Attempting login at ${apiUrl}/api/auth/login`);
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log(`[Auth] Login response status: ${response.status}`);
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Login failed';
        try {
          const errObj = JSON.parse(text);
          errorMessage = errObj.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await parseJsonResponse<{ user: User; token: string }>(response);
      if (!data) {
        throw new Error('Invalid login response from server');
      }

      setAuthToken(data.token);
      setUser(normalizeUser(data.user));
      return data;
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to server. Unable to reach backend at ${getApiBaseUrl()}. Please ensure the backend is running.`);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      const apiUrl = getApiBaseUrl();
      await fetch(`${apiUrl}/api/auth/logout`, { method: 'POST' });
    } catch (e) {
      console.warn('Logout request failed, continuing local clear', e);
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const apiUrl = getApiBaseUrl();
      console.log(`[Auth] Attempting signup at ${apiUrl}/api/auth/register`);
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      console.log(`[Auth] Signup response status: ${response.status}`);
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Signup failed';
        try {
          const errObj = JSON.parse(text);
          errorMessage = errObj.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await parseJsonResponse<{ user: User; token: string }>(response);
      if (!result) {
        throw new Error('Invalid signup response from server');
      }

      setAuthToken(result.token);
      setUser(normalizeUser(result.user));
      return result;
    } catch (error: any) {
      console.error('[Auth] Signup error:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to server. Unable to reach backend at ${getApiBaseUrl()}.`);
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        signup,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
