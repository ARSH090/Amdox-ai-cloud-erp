import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAuditEntry(tenantId: string, userId: string, action: string, entity: string, entityId: string, payload: string): Promise<any> {
    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      const lastBlock = await tx.auditLog.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      const prevHash = lastBlock ? lastBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date().toISOString();

      const hash = crypto
        .createHash('sha256')
        .update(prevHash + payload + timestamp + userId + action + entity + entityId)
        .digest('hex');

      const auditDocument = await tx.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          payload,
          prevHash,
          hash
        }
      });

      this.logger.debug(`🛡️ Audit log block secured in TimescaleDB. Hash: ${hash.slice(0, 16)}...`);
      return auditDocument;
    });
  }

  async verifyChainIntegrity(tenantId: string): Promise<boolean> {
    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      const blocks = await tx.auditLog.findMany({
        orderBy: { createdAt: 'asc' }
      });

      for (let i = 1; i < blocks.length; i++) {
        const currentBlock = blocks[i];
        const previousBlock = blocks[i - 1];

        if (currentBlock.prevHash !== previousBlock.hash) {
          this.logger.error(`🚨 CRYPTOGRAPHIC CORRUPTION DETECTED AT LOG BLOCK ID: ${currentBlock.id}`);
          return false;
        }
      }
      return true;
    });
  }
}
