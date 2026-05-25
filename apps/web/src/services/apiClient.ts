// apps/web/src/services/apiClient.ts
'use client';

const NEST_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  idempotencyKey?: string;
  bodyData?: any;
}

/**
 * Production API Transport Bridge.
 * Bypasses browser sandbox caches to route directly to live NestJS endpoints.
 */
export async function fetchFromProductionEngine<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const currentTenantId = typeof window !== 'undefined' ? (localStorage.getItem('amdox_tenant_id') || 'amdox-engineering') : 'amdox-engineering';
  const currentUserId = typeof window !== 'undefined' ? (localStorage.getItem('amdox_user_id') || 'root-system-admin') : 'root-system-admin';

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Tenant-Id', currentTenantId);
  headers.set('X-User-Id', currentUserId);

  if (options.idempotencyKey) {
    headers.set('X-Idempotency-Key', options.idempotencyKey);
  }

  const activeToken = typeof window !== 'undefined' ? localStorage.getItem('amdox_auth_token') : null;
  if (activeToken) {
    headers.set('Authorization', `Bearer ${activeToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.bodyData) {
    config.body = JSON.stringify(options.bodyData);
  }

  try {
    const response = await fetch(`${NEST_API_BASE}/${endpoint}`, config);

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.message || `API Exception Encountered: HTTP Status ${response.status}`);
    }

    return await response.json() as T;
  } catch (networkFault: any) {
    console.error(`[CRITICAL_NETWORK_FAILURE] [Target: ${endpoint}]:`, networkFault.message);
    throw networkFault;
  }
}
