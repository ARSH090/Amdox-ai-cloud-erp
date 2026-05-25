// packages/types/src/index.ts
export interface UserContext {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  plan: 'trial' | 'starter' | 'enterprise';
  isActive: boolean;
}

export interface LedgerAccount {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  currency: string;
  isActive: boolean;
}
