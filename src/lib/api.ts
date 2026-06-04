const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getTokens() {
  if (typeof window === 'undefined') return { access: null, refresh: null };
  return {
    access: localStorage.getItem('fd_access'),
    refresh: localStorage.getItem('fd_refresh'),
  };
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('fd_access', access);
  localStorage.setItem('fd_refresh', refresh);
}

export function setBranchTokens(access: string, refresh: string, user: object) {
  localStorage.setItem('fd_access', access);
  localStorage.setItem('fd_refresh', refresh);
  localStorage.setItem('fd_user', JSON.stringify(user));
}

export function clearBranchTokens() {
  localStorage.removeItem('fd_access_parent');
  localStorage.removeItem('fd_refresh_parent');
  localStorage.removeItem('fd_user_parent');
  localStorage.removeItem('fd_branch_context');
}

export function clearTokens() {
  localStorage.removeItem('fd_access');
  localStorage.removeItem('fd_refresh');
  localStorage.removeItem('fd_user');
  localStorage.removeItem('fd_access_parent');
  localStorage.removeItem('fd_refresh_parent');
  localStorage.removeItem('fd_user_parent');
  localStorage.removeItem('fd_branch_context');
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let { access } = getTokens();

  const makeRequest = async (token: string | null) =>
    fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let res = await makeRequest(access);

  // Rutas públicas (login, refresh) no deben intentar refrescar token ni redirigir
  const isPublicPath = path.startsWith('/auth/');

  if (res.status === 401 && !isPublicPath) {
    access = await refreshAccessToken();
    if (!access) {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    res = await makeRequest(access);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'API error');
  }

  return res.json();
}

export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path),
  post: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = any>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
  // Para uploads multipart/form-data — no pasar Content-Type, el browser lo pone con boundary
  postForm: <T = any>(path: string, formData: FormData): Promise<T> => {
    const access = typeof window !== 'undefined' ? localStorage.getItem('fd_access') : null;
    return fetch(`${BASE}${path}`, {
      method: 'POST',
      body: formData,
      headers: access ? { Authorization: `Bearer ${access}` } : {},
    }).then(r => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    });
  },
  setTokens,
};
