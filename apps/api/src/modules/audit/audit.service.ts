// apps/api/src/modules/audit/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  // In-memory mock or DB wrapper for append-only audit trail
  private auditLogChain: Array<{
    id: string;
    timestamp: Date;
    tenantId: string;
    payload: string;
    prevHash: string;
    hash: string;
  }> = [];

  constructor() {
    // Genesis block init
    this.createAuditEntry('GENESIS_SYSTEM_HANDSHAKE', '0');
  }

  /**
   * Append a log entry using cryptographic SHA-256 hash chaining
   */
  async createAuditEntry(payload: string, tenantId: string = 'system'): Promise<any> {
    const prevBlock = this.auditLogChain[this.auditLogChain.length - 1];
    const prevHash = prevBlock ? prevBlock.hash : '0';
    const timestamp = new Date();
    
    // Hash chain formulation: SHA256(prevHash + payload + timestamp)
    const hash = crypto
      .createHash('sha256')
      .update(prevHash + payload + timestamp.toISOString())
      .digest('hex');

    const entry = {
      id: crypto.randomUUID(),
      timestamp,
      tenantId,
      payload,
      prevHash,
      hash,
    };

    this.auditLogChain.push(entry);
    this.logger.log(`Cryptographic Audit Log Appended: [EntryID: ${entry.id}]`);
    return entry;
  }

  /**
   * Verify integrity of the entire audit log chain
   */
  async verifyChainIntegrity(): Promise<boolean> {
    this.logger.log('Executing integrity verification sweep over audit log chain...');
    
    for (let i = 1; i < this.auditLogChain.length; i++) {
      const current = this.auditLogChain[i];
      const previous = this.auditLogChain[i - 1];

      // Check pointer connection
      if (current.prevHash !== previous.hash) {
        this.logger.error(`Audit chain tamper detected: Block pointer mismatch at Block ${current.id}`);
        return false;
      }

      // Check current hash integrity
      const expectedHash = crypto
        .createHash('sha256')
        .update(previous.hash + current.payload + current.timestamp.toISOString())
        .digest('hex');

      if (current.hash !== expectedHash) {
        this.logger.error(`Audit chain tamper detected: Content hash mismatch at Block ${current.id}`);
        return false;
      }
    }

    this.logger.log('Audit chain verification successful. Zero tamper anomalies detected.');
    return true;
  }
}
