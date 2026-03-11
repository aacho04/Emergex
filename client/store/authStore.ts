'use client';

import { create } from 'zustand';
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
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:
    typeof window !== 'undefined' && localStorage.getItem('emergex_user')
      ? JSON.parse(localStorage.getItem('emergex_user')!)
      : null,
  token:
    typeof window !== 'undefined'
      ? localStorage.getItem('emergex_token')
      : null,
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
}));
