// apps/api/src/modules/forecasting/forecasting.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ForecastingService } from './forecasting.service';
import { ForecastingController } from './forecasting.controller';

@Module({
  imports: [HttpModule],
  controllers: [ForecastingController],
  providers: [ForecastingService],
  exports: [ForecastingService],
})
export class ForecastingModule {}
