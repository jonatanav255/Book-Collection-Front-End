'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  getAccessToken,
  getUsername,
  clearTokens,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  refreshTokens,
  setAuthFailureListener,
} from '@/services/auth';

interface User {
  username: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <svg
          className="animate-spin h-8 w-8 text-indigo-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Subscribe to auth failure events so that when authFetch detects an
  // expired/revoked token and clears localStorage, React state updates
  // and AuthGuard redirects to /login.
  useEffect(() => {
    setAuthFailureListener(() => {
      setUser(null);
      queryClient.clear();
    });
    return () => setAuthFailureListener(null);
  }, [queryClient]);

  useEffect(() => {
    async function initAuth() {
      const token = getAccessToken();
      const username = getUsername();

      if (token && username) {
        try {
          await refreshTokens();
          setUser({ username: getUsername() || username });
        } catch {
          // refreshTokens already clears tokens and notifies via listener
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await authLogin(username, password);
    setUser({ username: response.username });
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const response = await authRegister(username, password);
    setUser({ username: response.username });
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    queryClient.clear();
    router.replace('/login');
  }, [queryClient, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
