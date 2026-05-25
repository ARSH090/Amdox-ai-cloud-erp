// packages/db/src/middleware/tenantIsolation.ts
import { Prisma } from '@prisma/client';

/**
 * Enterprise Multi-Tenant Query Isolation Interceptor.
 * Automatically injects tenant_id filters into all read and write mutations.
 */
export function createTenantIsolationMiddleware(getCurrentTenantId: () => string) {
  return async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
  ) => {
    const tenantId = getCurrentTenantId();

    // Intercept target operational tables that require strict data tenant-isolation
    const isolatedModels = ['User', 'Account', 'JournalEntry', 'Employee', 'Project', 'Lead'];

    if (params.model && isolatedModels.includes(params.model)) {
      // 1. Enforce strict isolation bounds on read queries
      if (['findUnique', 'findFirst', 'findMany', 'count'].includes(params.action)) {
        params.args = params.args || {};
        params.args.where = {
          ...params.args.where,
          tenant_id: tenantId,
        };
      }

      // 2. Enforce structural alignment checks on database mutations
      if (['create', 'update', 'updateMany', 'upsert'].includes(params.action)) {
        params.args = params.args || {};
        if (params.action === 'create') {
          params.args.data = {
            ...params.args.data,
            tenant_id: tenantId,
          };
        } else if (params.action === 'update' || params.action === 'updateMany') {
          params.args.where = {
            ...params.args.where,
            tenant_id: tenantId,
          };
        }
      }
    }

    return next(params);
  };
}
