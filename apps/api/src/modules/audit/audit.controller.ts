// apps/api/src/modules/audit/audit.controller.ts
import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GdprService } from './gdpr.service';

@Controller('audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly gdprService: GdprService,
  ) {}

  /**
   * POST /audit/log
   * Append a new cryptographic audit log entry.
   */
  @Post('log')
  async createLogEntry(
    @Body() body: { payload: string; tenantId?: string },
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Appending audit log entry for tenant: ${body.tenantId || 'system'}`);
    return this.auditService.createAuditEntry(body.payload, body.tenantId);
  }

  /**
   * GET /audit/verify
   * Verify the integrity of the entire audit log hash chain.
   */
  @Get('verify')
  async verifyIntegrity(): Promise<Record<string, unknown>> {
    const isValid = await this.auditService.verifyChainIntegrity();
    return {
      status: isValid ? 'CHAIN_INTEGRITY_OK' : 'CHAIN_TAMPER_DETECTED',
      verified_at: new Date().toISOString(),
    };
  }

  /**
   * POST /audit/gdpr-erasure
   * Execute a GDPR right-to-erasure cascade for an employee.
   */
  @Post('gdpr-erasure')
  async executeGdprErasure(
    @Body() body: { tenantId: string; employeeId: string; isDryRun?: boolean },
  ): Promise<Record<string, unknown>> {
    this.logger.log(`GDPR erasure request received for employee: ${body.employeeId}`);
    return this.gdprService.executeErasureRequest(
      body.tenantId,
      body.employeeId,
      body.isDryRun ?? false,
    );
  }
}
