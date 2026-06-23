import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  tenantId?: string;
  userId?: string;
  correlationId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
