'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, getMe, login as apiLogin, logout as apiLogout, getCsrfCookie, LoginPayload } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await getMe();
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCsrfCookie();
        await refreshUser();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [refreshUser]);

  const login = async (payload: LoginPayload) => {
    await getCsrfCookie();
    const response = await apiLogin(payload);
    if (response.success && response.data) {
      setUser(response.data.user);
    } else {
      throw new Error(response.message || 'Login gagal');
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
