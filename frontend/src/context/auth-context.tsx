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
    isRepeatClient?: boolean;
    lifetimeSpendBdt?: number;
    privilegeDiscountPercent?: number;
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
  // Initialize user immediately from cached storage to prevent flash of unauthenticated state on page reload
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('seyven_client_profile');
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore JSON parse error
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchProfile = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('seyven_access_token') : null;
    if (!token) {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('seyven_client_profile');
      }
      setIsLoading(false);
      return;
    }

    // Check if offline/demo session exists in localStorage
    const savedDemoUser = typeof window !== 'undefined' ? localStorage.getItem('seyven_demo_user') : null;
    if (token.startsWith('demo_') && savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setUser(parsed);
        localStorage.setItem('seyven_client_profile', JSON.stringify(parsed));
        setIsLoading(false);
        return;
      } catch {
        // Fall through to API fetch
      }
    }

    try {
      const profile = await apiFetch<UserProfile>('/auth/me');
      setUser(profile);
      if (typeof window !== 'undefined' && profile) {
        localStorage.setItem('seyven_client_profile', JSON.stringify(profile));
      }
    } catch (err: any) {
      // STRICT 401 GUARD: Only clear tokens when server explicitly returns HTTP 401 Unauthorized
      // Network drops, aborted fetches during rapid F5, or transient gateway timeouts MUST NOT log the user out!
      const status = err?.status || (err?.message && err.message.includes('HTTP 401') ? 401 : null);

      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('seyven_access_token');
          localStorage.removeItem('seyven_refresh_token');
          localStorage.removeItem('seyven_client_profile');
          localStorage.removeItem('seyven_demo_user');
        }
        setUser(null);
      } else {
        // Transient network issue or aborted reload: Keep current cached profile intact
        console.warn('[AuthContext] Background profile sync skipped due to network/abort; keeping session active.');
      }
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
        if (response.user) {
          localStorage.setItem('seyven_client_profile', JSON.stringify(response.user));
          setUser(response.user);
        }
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
        if (response.user) {
          localStorage.setItem('seyven_client_profile', JSON.stringify(response.user));
          setUser(response.user);
        }
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
        if (response.user) {
          localStorage.setItem('seyven_client_profile', JSON.stringify(response.user));
          setUser(response.user);
        }
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
      localStorage.removeItem('seyven_client_profile');
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
