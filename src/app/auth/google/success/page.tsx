'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';

function isSuperAdmin(user: { role?: string; platform_admin?: boolean } | null) {
  return user?.role === 'superadmin' || user?.platform_admin === true;
}

export default function GoogleSuccessPage() {
  const router = useRouter();
  const loginWithTokens = useAuth((s) => s.loginWithTokens);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const userRaw = params.get('user');

    if (!accessToken || !refreshToken || !userRaw) {
      router.replace('/login?error=Error+al+iniciar+sesion+con+Google');
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      loginWithTokens(accessToken, refreshToken, user);
      router.replace(isSuperAdmin(user) ? '/admin' : '/dashboard');
    } catch {
      router.replace('/login?error=Error+al+procesar+la+sesion');
    }
  }, [router, loginWithTokens]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
          <span className="text-2xl font-bold text-white">F</span>
        </div>
        <p className="text-gray-400 mt-2 text-sm">Iniciando sesion...</p>
      </div>
    </div>
  );
}