import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import Redis from 'ioredis';

@Injectable()
export class ForecastingService {
  private readonly logger = new Logger(ForecastingService.name);
  private readonly mlServiceUrl: string;
  private readonly redis: Redis;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://ml-service:8000');
    this.redis = new Redis(this.configService.get<string>('REDIS_URL', 'redis://localhost:6379/0'), {
      maxRetriesPerRequest: null,
      retryStrategy: () => null,
    });
  }

  async forecastRevenue(tenantId: string, periods: number = 30) {
    const cacheKey = `forecast:revenue:${tenantId}:${periods}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      // Aggregate historical revenue from JournalLines (Credits to Revenue accounts)
      const revenueData = await tx.$queryRaw`
        SELECT 
          DATE(je."postedAt") as ds, 
          SUM(jl.credit - jl.debit) as y 
        FROM "JournalLine" jl
        JOIN "JournalEntry" je ON jl."entryId" = je.id
        JOIN "Account" a ON jl."accountId" = a.id
        WHERE a.type = 'revenue' 
          AND je."tenantId" = ${tenantId}::uuid
          AND je."isReversed" = false
        GROUP BY DATE(je."postedAt")
        ORDER BY ds ASC
      `;

      if (!revenueData || (revenueData as any[]).length < 10) {
        throw new HttpException('Insufficient historical data for forecasting', HttpStatus.BAD_REQUEST);
      }

      const payload = {
        tenant_id: tenantId,
        history: (revenueData as any[]).map(d => ({
          ds: d.ds.toISOString().split('T')[0],
          y: parseFloat(d.y)
        })),
        periods
      };

      const response = await fetch(`${this.mlServiceUrl}/forecast/revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new HttpException('ML Service failed', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const result = await response.json();
      
      // Cache for 12 hours
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 43200);

      return result;
    });
  }
}
