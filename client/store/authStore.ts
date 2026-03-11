'use client';

import { create } from 'zustand';
import { useEffect, useState } from 'react';
import { UserRole } from '@/types/user.types';

interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  _hydrated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  _hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  _hydrated: false,
  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emergex_token', token);
      localStorage.setItem('emergex_user', JSON.stringify(user));
    }
    set({ token, user });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('emergex_token');
      localStorage.removeItem('emergex_user');
    }
    set({ token: null, user: null });
  },
  _hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('emergex_token');
      const userStr = localStorage.getItem('emergex_user');
      const user = userStr ? JSON.parse(userStr) : null;
      set({ token, user, _hydrated: true });
    }
  },
}));

// Hook to hydrate auth state from localStorage on mount (client-only)
export function useAuthHydration() {
  const hydrate = useAuthStore((s) => s._hydrate);
  const hydrated = useAuthStore((s) => s._hydrated);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  return hydrated;
}
