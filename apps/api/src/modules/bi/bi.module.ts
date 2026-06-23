// apps/api/src/modules/bi/bi.module.ts
import { Module } from '@nestjs/common';
import { BiService } from './bi.service';
import { BiController } from './bi.controller';
import { BiResolver } from './bi.resolver';

import { PrismaService } from '../../database/prisma.service';
import { ForecastingService } from './forecasting.service';

@Module({
  controllers: [BiController],
  providers: [BiService, BiResolver, ForecastingService, PrismaService],
  exports: [BiService, BiResolver],
})
export class BiModule {}
