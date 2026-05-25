// apps/api/src/modules/finance/finance.module.ts
import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, PrismaService],
  exports: [FinanceService]
})
export class FinanceModule {}
