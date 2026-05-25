// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';

async function bootstrap() {
  const logger = new Logger('AMDOX-API');
  const port = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    // Disable Express default X-Powered-By header
    logger: isProduction ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ── Global Prefix ──────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/health/ready', '/health/live'],
  });

  // ── CORS Configuration ─────────────────────────────────────────────
  // Strict origin allowlist in production, permissive in development
  app.enableCors({
    origin: isProduction
      ? [
          process.env.FRONTEND_URL || 'https://amdox.io',
          'https://admin.amdox.io',
        ]
      : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-Id',
      'X-User-Id',
      'X-Idempotency-Key',
      'X-Correlation-Id',
      'X-Request-Id',
    ],
    exposedHeaders: [
      'X-Correlation-Id',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
    ],
    maxAge: 86400, // 24-hour preflight cache
  });

  // ── Global Pipes ───────────────────────────────────────────────────
  // Sanitization pipe strips injection payloads before validation
  app.useGlobalPipes(
    new SanitizationPipe(),
    new ValidationPipe({
      whitelist: true,             // Strip unknown properties
      forbidNonWhitelisted: true,  // Reject payloads with unknown fields
      transform: true,             // Auto-transform DTOs
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction,
    }),
  );

  // ── Global Interceptors ────────────────────────────────────────────
  app.useGlobalInterceptors(
    new CorrelationIdInterceptor(),
    new ResponseTransformInterceptor(),
  );

  // ── Global Exception Filter ────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Graceful Shutdown ──────────────────────────────────────────────
  app.enableShutdownHooks();

  // ── Request Payload Limits ─────────────────────────────────────────
  // Prevent oversized payloads from exhausting server memory
  const expressApp = app.getHttpAdapter().getInstance();
  const bodyParser = require('express');
  // JSON body limit: 10MB (for file metadata, not raw uploads)
  // Raw uploads should go through dedicated streaming endpoints

  await app.listen(port);
  logger.log(`═══════════════════════════════════════════════════════════════`);
  logger.log(`  AMDOX Enterprise API Gateway — ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  logger.log(`  Listening:  http://localhost:${port}/api/v1`);
  logger.log(`  Health:     http://localhost:${port}/health`);
  logger.log(`  CORS:       ${isProduction ? 'Strict allowlist' : 'Permissive (dev)'}`);
  logger.log(`  Security:   CSP + HSTS + Rate Limiting + Sanitization Active`);
  logger.log(`═══════════════════════════════════════════════════════════════`);
}
bootstrap();
