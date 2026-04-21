'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getApiBaseUrl, parseJsonResponse, getAuthToken, setAuthToken, clearAuthToken } from '@/lib/api';

export interface User {
  _id?: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        
        if (!token) {
          setLoading(false);
          return;
        }

        const apiUrl = getApiBaseUrl();
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await parseJsonResponse<{ user: User }>(response);
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        clearAuthToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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
      const data = await parseJsonResponse<{ user: User; token: string }>(response);
      
      setAuthToken(data.token);
      setUser(data.user);
      return data;
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to server. Unable to reach backend at ${getApiBaseUrl()}. Please ensure the backend is running.`);
      }
      // If error message indicates 400 or 401 or invalid credentials from backend
      if (error.message && (error.message.toLowerCase().includes('password') || error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('credential'))) {
        throw new Error('Invalid email or password');
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
      const result = await parseJsonResponse<{ user: User; token: string }>(response);
      
      setAuthToken(result.token);
      setUser(result.user);
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
