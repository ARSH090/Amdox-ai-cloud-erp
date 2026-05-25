// apps/api/src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './database/prisma.service';
import { FinanceController } from './modules/finance/finance.controller';
import { FinanceService } from './modules/finance/finance.service';
import { HrController } from './modules/hr/hr.controller';
import { HrService } from './modules/hr/hr.service';
import { PayrollBatchProcessor } from './modules/payroll/payroll.processor';
import { SupplyChainController } from './modules/supply-chain/supply-chain.controller';
import { SupplyChainService } from './modules/supply-chain/supply-chain.service';
import { AuthModule } from './modules/auth/auth.module';
import { ForecastingModule } from './modules/forecasting/forecasting.module';
import { AuditModule } from './modules/audit/audit.module';
import { BiModule } from './modules/bi/bi.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { HealthModule } from './health/health.module';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { RateLimiterMiddleware } from './common/middleware/rate-limiter.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    // ── Global Configuration ──────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ── BullMQ Queue Infrastructure ──────────────────────────────
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'payroll-processing-matrix',
    }),

    // ── Feature Domain Modules ───────────────────────────────────
    AuthModule,
    ForecastingModule,
    AuditModule,
    BiModule,
    NotificationsModule,
    ProjectsModule,
    HealthModule,
  ],
  controllers: [FinanceController, HrController, SupplyChainController],
  providers: [
    PrismaService,
    FinanceService,
    HrService,
    PayrollBatchProcessor,
    SupplyChainService,
    Reflector,

    // ── Global JWT Auth Guard ──────────────────────────────────────
    // Applied to all routes. Use @Public() decorator to exempt routes.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // ── Security Headers (all routes) ─────────────────────────────
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');

    // ── Rate Limiting (all routes) ────────────────────────────────
    consumer
      .apply(RateLimiterMiddleware)
      .forRoutes('*');

    // ── Tenant Context Injection (all routes) ─────────────────────
    consumer
      .apply((req: any, res: any, next: () => void) => {
        const tenantId = req.headers['x-tenant-id'];
        const userId = req.headers['x-user-id'];
        (global as any).currentRequestContext = { tenantId, userId };
        next();
      })
      .forRoutes('*');
  }
}
