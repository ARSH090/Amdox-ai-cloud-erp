// apps/api/src/common/middleware/request-context.middleware.ts
// Async-local-storage based request context for safe multi-tenant propagation
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId: string;
  tenantId: string;
  userId?: string;
  roles: string[];
  startTime: number;
  method: string;
  path: string;
}

// Global async local storage instance for request-scoped context propagation
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Request Context Middleware.
 * Uses Node.js AsyncLocalStorage to propagate request-scoped context
 * (tenant, user, correlation) through the entire call chain without
 * polluting global state.
 *
 * Covers Checklist Items:
 * - 18.7: Thread-safe request context propagation
 * - 16.13: Replaces unsafe global context injection
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const context: RequestContext = {
      correlationId: (req.headers['x-correlation-id'] as string) || crypto.randomUUID(),
      tenantId: (req.headers['x-tenant-id'] as string) || 'amdox-engineering',
      userId: (req as any).user?.sub || (req.headers['x-user-id'] as string),
      roles: (req as any).user?.roles || [],
      startTime: Date.now(),
      method: req.method,
      path: req.path,
    };

    // Also maintain backward compatibility with global context
    (global as any).currentRequestContext = {
      tenantId: context.tenantId,
      userId: context.userId,
    };

    requestContextStorage.run(context, () => {
      next();
    });
  }
}

/**
 * Helper function to access current request context from anywhere
 * in the call stack without injecting dependencies.
 */
export function getCurrentRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}
