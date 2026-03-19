"use client";

import React, { createContext, useContext, useState } from "react";
import { authAPI } from "@/lib/authAPI";

interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "artist" | "admin";
  status: "pending" | "approved" | "rejected";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success?: boolean; message?: string; token?: string; user: User }>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = authAPI.getUser();
    return storedUser || null;
  });

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    setUser(response.user);
    return response;
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    const response = await authAPI.register(name, email, password, role);
    setUser(response.user);
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: false,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
