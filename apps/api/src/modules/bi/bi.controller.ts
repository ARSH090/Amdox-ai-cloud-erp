// apps/api/src/modules/bi/bi.controller.ts
import { Controller, Get, Headers, Res, Logger } from '@nestjs/common';
import { BiService } from './bi.service';
import { Response } from 'express';

@Controller('bi')
export class BiController {
  private readonly logger = new Logger(BiController.name);

  constructor(private readonly biService: BiService) {}

  /**
   * GET /bi/analytics
   * Return read-isolated BI analytics for the current tenant.
   */
  @Get('analytics')
  async getAnalytics(
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<Record<string, unknown>> {
    this.logger.log(`BI analytics request for tenant: ${tenantId || 'default'}`);
    return this.biService.getReadIsolatedAnalytics(tenantId || 'amdox-engineering');
  }

  /**
   * GET /bi/export
   * Stream a large CSV dataset directly to the client.
   */
  @Get('export')
  async exportData(
    @Headers('x-tenant-id') tenantId: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`BI export stream initiated for tenant: ${tenantId || 'default'}`);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="amdox-bi-export.csv"');
    await this.biService.streamBigExcelExtraction(tenantId || 'amdox-engineering', res);
  }
}
