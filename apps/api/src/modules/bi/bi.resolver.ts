import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { ForecastingService } from './forecasting.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class BiResolver {
  constructor(
    private prisma: PrismaService,
    private forecasting: ForecastingService
  ) {}

  @Query(() => String)
  async getDashboardWidgets(@Context() context: any) {
    const tenantId = context.req.tenantId;
    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      const widgets = await tx.dashboardWidget.findMany();
      return JSON.stringify(widgets);
    });
  }

  @Query(() => String)
  async getRevenueForecast(@Context() context: any, @Args('periods') periods: number) {
    const tenantId = context.req.tenantId;
    const forecast = await this.forecasting.forecastRevenue(tenantId, periods);
    return JSON.stringify(forecast);
  }
}
