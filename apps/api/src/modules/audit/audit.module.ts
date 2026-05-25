// apps/api/src/modules/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GdprService } from './gdpr.service';
import { AuditController } from './audit.controller';

@Module({
  controllers: [AuditController],
  providers: [AuditService, GdprService],
  exports: [AuditService, GdprService],
})
export class AuditModule {}
