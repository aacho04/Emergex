'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydration } from '@/store/authStore';
import { authAPI } from '@/services/api';
import { UserRole } from '@/types/user.types';

export const useAuth = () => {
  const router = useRouter();
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const hydrated = useAuthHydration();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setAuth(token, res.data.data.user);
        } catch {
          clearAuth();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [hydrated]);

  const login = async (username: string, password: string) => {
    const res = await authAPI.login({ username, password });
    const { token: newToken, user: userData } = res.data.data;

    setAuth(newToken, userData);

    // Redirect based on role
    const dashboardRoutes: Record<string, string> = {
      [UserRole.SUPER_ADMIN]: '/dashboard/super-admin',
      [UserRole.ERS_OFFICER]: '/dashboard/ers',
      [UserRole.AMBULANCE]: '/dashboard/ambulance',
      [UserRole.TRAFFIC_POLICE]: '/dashboard/traffic-police',
      [UserRole.HOSPITAL]: '/dashboard/hospital',
    };

    router.push(dashboardRoutes[userData.role] || '/dashboard');
  };

  const logout = () => {
    clearAuth();
    router.push('/login');
  };

  return {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };
};
