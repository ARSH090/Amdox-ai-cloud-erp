import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createTenantExtension } from './prisma.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Extend Prisma Client with the custom extension for tenant isolation
  public extendedClient = this.$extends(createTenantExtension());

  async onModuleInit() {
    this.logger.log('Initializing Prisma Client...');
    try {
      await this.$connect();
    } catch (e) {
      this.logger.warn('Failed to connect to Prisma Client. The database server may be offline.');
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Prisma Client...');
    await this.$disconnect();
  }

  /**
   * Executes a transaction wrapped with Postgres RLS context activation.
   * Runs: SELECT set_config('app.current_tenant_id', tenantId, true)
   */
  async runInTenantContext<T>(
    tenantId: string,
    fn: (tx: any) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // Set the current_tenant_id for Row-Level Security
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_tenant_id', $1, true)`,
        tenantId,
      );
      
      // Execute the provided function within the transaction context
      return await fn(tx);
    });
  }
}
