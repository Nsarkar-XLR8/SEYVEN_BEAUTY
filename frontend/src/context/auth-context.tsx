'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

export interface UserProfile {
  id: string;
  phone: string;
  fullName?: string | null;
  email?: string | null;
  role: string;
  loyalty?: {
    tier: string;
    pointsBalance?: number;
    lifetimePoints?: number;
    lifetimeSpendBdt?: number;
    privilegeDiscountPercent?: number;
    isRepeatClient?: boolean;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  register: (data: { fullName: string; phone: string; email: string; password: string }) => Promise<boolean>;
  login: (data: { identifier: string; password: string }) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; expiresInSeconds?: number }>;
  resetPassword: (data: { email: string; code: string; newPassword: string }) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; expiresInSeconds: number }>;
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  register: async () => false,
  login: async () => false,
  forgotPassword: async () => ({ success: false, message: '' }),
  resetPassword: async () => false,
  sendOtp: async () => ({ success: false, message: '', expiresInSeconds: 0 }),
  verifyOtp: async () => false,
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchProfile = async () => {
    const token = localStorage.getItem('seyven_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Check if offline/demo session exists in localStorage
    const savedDemoUser = localStorage.getItem('seyven_demo_user');
    if (token.startsWith('demo_') && savedDemoUser) {
      try {
        setUser(JSON.parse(savedDemoUser));
        setIsLoading(false);
        return;
      } catch {
        // Fall through to API fetch
      }
    }

    try {
      const profile = await apiFetch<UserProfile>('/auth/me');
      setUser(profile);
    } catch {
      // If backend database is offline but demo session is saved, preserve user
      if (savedDemoUser) {
        try {
          setUser(JSON.parse(savedDemoUser));
          setIsLoading(false);
          return;
        } catch {}
      }
      localStorage.removeItem('seyven_access_token');
      localStorage.removeItem('seyven_refresh_token');
      localStorage.removeItem('seyven_demo_user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const register = async (data: { fullName: string; phone: string; email: string; password: string }) => {
    try {
      const response = await apiFetch<{
        tokens: { accessToken: string; refreshToken: string };
        user: UserProfile;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response?.tokens?.accessToken) {
        localStorage.setItem('seyven_access_token', response.tokens.accessToken);
        localStorage.setItem('seyven_refresh_token', response.tokens.refreshToken);
        setUser(response.user);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const login = async (data: { identifier: string; password: string }) => {
    try {
      const response = await apiFetch<{
        tokens: { accessToken: string; refreshToken: string };
        user: UserProfile;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response?.tokens?.accessToken) {
        localStorage.setItem('seyven_access_token', response.tokens.accessToken);
        localStorage.setItem('seyven_refresh_token', response.tokens.refreshToken);
        setUser(response.user);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const sendOtp = async () => {
    return { success: false, message: 'OTP service is decommissioned. Please log in with password.', expiresInSeconds: 0 };
  };

  const verifyOtp = async () => {
    return false;
  };

  const forgotPassword = async (email: string) => {
    try {
      return await apiFetch<{ success: boolean; message: string; expiresInSeconds?: number }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (err: any) {
      throw err;
    }
  };

  const resetPassword = async (data: { email: string; code: string; newPassword: string }) => {
    try {
      const response = await apiFetch<{
        tokens: { accessToken: string; refreshToken: string };
        user: UserProfile;
      }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response?.tokens?.accessToken) {
        localStorage.setItem('seyven_access_token', response.tokens.accessToken);
        localStorage.setItem('seyven_refresh_token', response.tokens.refreshToken);
        setUser(response.user);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('seyven_refresh_token');
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshToken || undefined }),
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('seyven_access_token');
      localStorage.removeItem('seyven_refresh_token');
      localStorage.removeItem('seyven_demo_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        register,
        login,
        forgotPassword,
        resetPassword,
        sendOtp,
        verifyOtp,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
