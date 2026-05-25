// apps/api/src/modules/hr/hr.module.ts
import { Module } from '@nestjs/common';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [HrController],
  providers: [HrService, PrismaService],
  exports: [HrService]
})
export class HrModule {}
