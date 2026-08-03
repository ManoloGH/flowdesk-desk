const SOC_BASE = process.env.NEXT_PUBLIC_SOC_API_URL
  ?? 'https://soc-requirements-production.up.railway.app';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fd_access');
}

export async function socFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  return fetch(`${SOC_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export const SOC_API = SOC_BASE;
