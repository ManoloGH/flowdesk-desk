// Use the local Next.js proxy so the browser never calls the SOC API directly.
// The proxy re-signs the request with the correct SOC JWT secret, avoiding
// any mismatch between the FlowDesk JWT_SECRET and the SOC API Jwt__Secret.
const SOC_BASE = '/api/soc';

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
