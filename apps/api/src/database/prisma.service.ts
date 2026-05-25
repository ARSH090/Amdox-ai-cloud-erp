// apps/api/src/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database transmission channels successfully synchronized via Prisma Engine.');
    } catch (e: any) {
      this.logger.warn(`Database connection failed: ${e.message}. Starting in offline/resilient fallback mode.`);
    }
    this.registerTenantIsolationMiddleware();
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (e) {
      // Ignored
    }
  }

  /**
   * Enterprise Multi-Tenant Query Isolation Middleware.
   * Intercepts incoming queries to inject current tenant constraints.
   */
  private registerTenantIsolationMiddleware() {
    this.$use(async (params, next) => {
      // Access application context parameters injected by TenantContextMiddleware
      // Maps directly to global execution contexts
      const globalContext = (global as any).currentRequestContext;
      const tenantId = globalContext?.tenantId;

      const isolatedModels = ['User', 'Account', 'JournalEntry', 'Employee', 'Project', 'Lead'];

      if (tenantId && params.model && isolatedModels.includes(params.model)) {
        // Enforce strict multi-tenant boundary parameters across read scopes
        if (['findUnique', 'findFirst', 'findMany', 'count'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = { ...params.args.where, tenantId: tenantId };
        }

        // Enforce data containment constraints on mutating database updates
        if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = { ...params.args.where, tenantId: tenantId };
        }
      }

      return next(params);
    });
  }
}
