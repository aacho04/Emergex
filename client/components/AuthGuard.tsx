'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydration } from '@/store/authStore';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getRoleDashboardPath } from '@/utils/helpers';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const hydrated = useAuthHydration();

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their own dashboard if they access wrong role's page
      router.replace(getRoleDashboardPath(user.role));
    }
  }, [token, user, allowedRoles, router, hydrated]);

  if (!hydrated || !token || !user) {
    return <PageLoader />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
