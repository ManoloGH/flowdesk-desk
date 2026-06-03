import { create } from 'zustand';
import { api, clearTokens, setBranchTokens, clearBranchTokens } from '@/lib/api';

interface User {
  slot_id: string;
  tenant_id: string;
  role: string;
  type: string;
  email: string;
  name?: string;
  tenant_type?: string;
  platform_admin?: boolean;
}

interface BranchContext {
  branch_id: string;
  branch_name: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  branchContext: BranchContext | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  enterBranch: (branchId: string, branchName: string, accessToken: string, refreshToken: string, branchUser: User) => void;
  exitBranch: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  branchContext: null,

  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    api.setTokens(data.access_token, data.refresh_token);
    localStorage.setItem('fd_user', JSON.stringify(data.user));
    set({ user: data.user, branchContext: null });
  },

  logout: () => {
    clearTokens();
    set({ user: null, branchContext: null });
    window.location.href = '/login';
  },

  loadUser: () => {
    try {
      const raw = localStorage.getItem('fd_user');
      const user = raw ? JSON.parse(raw) : null;
      const branchRaw = localStorage.getItem('fd_branch_context');
      const branchContext = branchRaw ? JSON.parse(branchRaw) : null;
      set({ user, loading: false, branchContext });
    } catch {
      set({ user: null, loading: false, branchContext: null });
    }
  },

  enterBranch: (branchId, branchName, accessToken, refreshToken, branchUser) => {
    // Guardar tokens actuales como "parent"
    const currentAccess = localStorage.getItem('fd_access');
    const currentRefresh = localStorage.getItem('fd_refresh');
    const currentUser = localStorage.getItem('fd_user');
    if (currentAccess) localStorage.setItem('fd_access_parent', currentAccess);
    if (currentRefresh) localStorage.setItem('fd_refresh_parent', currentRefresh);
    if (currentUser) localStorage.setItem('fd_user_parent', currentUser);

    // Activar tokens de la sucursal
    setBranchTokens(accessToken, refreshToken, branchUser);

    const ctx: BranchContext = { branch_id: branchId, branch_name: branchName };
    localStorage.setItem('fd_branch_context', JSON.stringify(ctx));

    set({ user: branchUser, branchContext: ctx });
  },

  exitBranch: () => {
    // Restaurar tokens parent
    const parentAccess = localStorage.getItem('fd_access_parent');
    const parentRefresh = localStorage.getItem('fd_refresh_parent');
    const parentUser = localStorage.getItem('fd_user_parent');

    clearBranchTokens();

    if (parentAccess) localStorage.setItem('fd_access', parentAccess);
    if (parentRefresh) localStorage.setItem('fd_refresh', parentRefresh);
    if (parentUser) localStorage.setItem('fd_user', parentUser);

    const user = parentUser ? JSON.parse(parentUser) : null;
    set({ user, branchContext: null });
  },
}));
