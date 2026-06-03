'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';

function hasAdminAccess(user: { role?: string; platform_admin?: boolean } | null): boolean {
  if (!user) return false;
  return user.role === 'superadmin' || user.platform_admin === true;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !hasAdminAccess(user)) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user || !hasAdminAccess(user)) return null;

  return <>{children}</>;
}
