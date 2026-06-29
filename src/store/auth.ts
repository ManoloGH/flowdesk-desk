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
  impersonating: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  enterBranch: (branchId: string, branchName: string, accessToken: string, refreshToken: string, branchUser: User) => void;
  exitBranch: () => void;
  enterCompany: (companyName: string, accessToken: string, companyUser: User) => void;
  exitCompany: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  branchContext: null,
  impersonating: null,

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
      let user = raw ? JSON.parse(raw) : null;
      if (!user && process.env.NODE_ENV === 'development') {
        user = {
          slot_id: 'dev', tenant_id: 'dev', role: 'superadmin',
          type: 'HUMAN', email: 'dev@flowdesk.mx', name: 'Dev Preview',
          tenant_type: 'PLATFORM', platform_admin: true,
        };
      }
      const branchRaw = localStorage.getItem('fd_branch_context');
      const branchContext = branchRaw ? JSON.parse(branchRaw) : null;
      const impersonating = localStorage.getItem('fd_impersonating');
      set({ user, loading: false, branchContext, impersonating });
    } catch {
      set({ user: null, loading: false, branchContext: null, impersonating: null });
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

  enterCompany: (companyName, accessToken, companyUser) => {
    // Guardar tokens actuales como parent
    const currentAccess = localStorage.getItem('fd_access');
    const currentRefresh = localStorage.getItem('fd_refresh');
    const currentUser = localStorage.getItem('fd_user');
    if (currentAccess)  localStorage.setItem('fd_access_parent',  currentAccess);
    if (currentRefresh) localStorage.setItem('fd_refresh_parent', currentRefresh);
    if (currentUser)    localStorage.setItem('fd_user_parent',    currentUser);

    // Activar tokens de la empresa — borrar fd_refresh para que el auto-refresh
    // no revierta silenciosamente al JWT del admin padre si el token expira
    localStorage.setItem('fd_access',       accessToken);
    localStorage.removeItem('fd_refresh');
    localStorage.setItem('fd_user',         JSON.stringify(companyUser));
    localStorage.setItem('fd_impersonating', companyName);

    set({ user: companyUser, impersonating: companyName });
  },

  exitCompany: () => {
    const parentAccess  = localStorage.getItem('fd_access_parent');
    const parentRefresh = localStorage.getItem('fd_refresh_parent');
    const parentUser    = localStorage.getItem('fd_user_parent');

    localStorage.removeItem('fd_impersonating');
    localStorage.removeItem('fd_access_parent');
    localStorage.removeItem('fd_refresh_parent');
    localStorage.removeItem('fd_user_parent');

    if (parentAccess)  localStorage.setItem('fd_access',  parentAccess);
    if (parentRefresh) localStorage.setItem('fd_refresh', parentRefresh);
    if (parentUser)    localStorage.setItem('fd_user',    parentUser);

    const user = parentUser ? JSON.parse(parentUser) : null;
    set({ user, impersonating: null });
  },
}));
