// apps/api/src/modules/forecasting/forecasting.controller.ts
import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ForecastingService } from './forecasting.service';

@Controller('forecasting')
export class ForecastingController {
  private readonly logger = new Logger(ForecastingController.name);

  constructor(private readonly forecastingService: ForecastingService) {}

  /**
   * POST /forecasting/predict
   * Generate AI demand predictions for a given SKU.
   */
  @Post('predict')
  async predictDemand(
    @Body() body: { sku: string; horizon_days?: number; historical_data?: any[] },
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Forecast prediction request received for SKU: ${body.sku}`);
    return this.forecastingService.getSkuForecast(
      body.sku,
      body.horizon_days || 90,
      body.historical_data || [],
    );
  }

  /**
   * POST /forecasting/train
   * Trigger a Prophet model retraining cycle for a specific SKU.
   */
  @Post('train')
  async trainModel(
    @Body() body: { sku: string; dataset: any[] },
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Training cycle initiated for SKU: ${body.sku}`);
    return this.forecastingService.triggerSkuTraining(body.sku, body.dataset);
  }

  /**
   * GET /forecasting/health
   * Health check for the ML service connectivity.
   */
  @Get('health')
  async checkHealth(): Promise<Record<string, unknown>> {
    return {
      service: 'forecasting',
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }
}
