import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from './database/prisma.service';

import { AuthModule } from './modules/auth/auth.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { SupplyChainModule } from './modules/supply-chain/supply-chain.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BiModule } from './modules/bi/bi.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ForecastingModule } from './modules/forecasting/forecasting.module';

import { FinanceService } from './modules/finance/finance.service';
import { InvoiceOcrService } from './modules/finance/invoice-ocr.service';
import { HrService } from './modules/hr/hr.service';
import { PayrollProcessor } from './modules/hr/payroll.processor';
import { PayslipGeneratorService } from './modules/hr/payslip-generator.service';
import { SupplyChainService } from './modules/supply-chain/supply-chain.service';
import { ReorderMonitorService } from './modules/supply-chain/reorder-monitor.service';
import { DagValidatorService } from './modules/projects/dag-validator';
import { ForecastingService } from './modules/bi/forecasting.service';
import { BiResolver } from './modules/bi/bi.resolver';
import { AuditService } from './modules/audit/audit.service';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantMiddleware, SecurityHeadersMiddleware } from './common/middlewares/middlewares';
import { TenantActivationMiddleware } from './common/middleware/tenant-activation.middleware';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      path: '/graphql',
      context: ({ req }: { req: any }) => ({ req }),
    }),
    AuthModule,
    FinanceModule,
    HrModule,
    SupplyChainModule,
    ProjectsModule,
    BiModule,
    AuditModule,
    NotificationsModule,
    ForecastingModule,
  ],
  providers: [
    PrismaService,
    FinanceService,
    InvoiceOcrService,
    HrService,
    // PayrollProcessor,
    PayslipGeneratorService,
    SupplyChainService,
    ReorderMonitorService,
    DagValidatorService,
    ForecastingService,
    BiResolver,
    AuditService,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    }
  ],
  exports: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');

    consumer
      .apply(TenantMiddleware, TenantActivationMiddleware)
      .forRoutes('*');
  }
}
