// apps/api/src/common/interceptors/logging.interceptor.ts
// Structured JSON request/response logging for observability pipelines
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

interface RequestLog {
  type: 'REQUEST';
  correlationId: string;
  method: string;
  url: string;
  tenantId?: string;
  userId?: string;
  clientIp: string;
  userAgent: string;
  contentLength: number;
  timestamp: string;
}

interface ResponseLog {
  type: 'RESPONSE';
  correlationId: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  timestamp: string;
}

/**
 * Structured Logging Interceptor.
 * Emits JSON-formatted request/response logs compatible with
 * ELK Stack, Datadog, and CloudWatch Log Insights.
 *
 * Covers Checklist Items:
 * - 18.1: Structured JSON logging for all API requests
 * - 18.5: Request/response duration tracking
 * - 18.6: User attribution in audit trails
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const correlationId = (request as any).correlationId || 'unknown';

    // Emit structured request entry log
    const requestLog: RequestLog = {
      type: 'REQUEST',
      correlationId,
      method: request.method,
      url: request.url,
      tenantId: request.headers['x-tenant-id'] as string,
      userId: (request as any).user?.sub,
      clientIp: request.ip || 'unknown',
      userAgent: request.headers['user-agent'] || 'unknown',
      contentLength: Number(request.headers['content-length']) || 0,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(JSON.stringify(requestLog));

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const responseLog: ResponseLog = {
            type: 'RESPONSE',
            correlationId,
            method: request.method,
            url: request.url,
            statusCode: response.statusCode,
            duration,
            timestamp: new Date().toISOString(),
          };

          // Color-code by latency threshold
          if (duration > 2000) {
            this.logger.warn(`SLOW ${JSON.stringify(responseLog)}`);
          } else {
            this.logger.log(JSON.stringify(responseLog));
          }
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            JSON.stringify({
              type: 'ERROR',
              correlationId,
              method: request.method,
              url: request.url,
              statusCode: err.status || 500,
              duration,
              error: err.message,
              timestamp: new Date().toISOString(),
            }),
          );
        },
      }),
    );
  }
}
