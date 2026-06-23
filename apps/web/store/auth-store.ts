import { create } from 'zustand';

export type TenantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  keycloakSub: string;
}

interface AuthState {
  user: User | null;
  tenantId: string | null;
  tenantStatus: TenantStatus | null;
  assignedRoles: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuthData: (data: Partial<AuthState>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenantId: null,
  tenantStatus: null,
  assignedRoles: [],
  isLoading: true,
  isAuthenticated: false,
  setAuthData: (data) => set((state) => ({ ...state, ...data })),
  clearAuth: () => set({
    user: null,
    tenantId: null,
    tenantStatus: null,
    assignedRoles: [],
    isAuthenticated: false,
    isLoading: false,
  }),
}));
