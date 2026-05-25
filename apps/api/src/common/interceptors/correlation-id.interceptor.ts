// apps/api/src/common/interceptors/correlation-id.interceptor.ts
// Injects and propagates correlation IDs across the request lifecycle
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

/**
 * Correlation ID Interceptor.
 * Ensures every request carries a unique correlation identifier for
 * distributed tracing across microservices. Propagates the ID via
 * response headers for client-side debugging.
 *
 * Covers Checklist Items:
 * - 16.11: Request tracing with correlation IDs
 * - 18.1: Distributed tracing header propagation
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CorrelationIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Use existing correlation ID from upstream proxy or generate a new one
    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      crypto.randomUUID();

    // Inject into request for downstream use
    request.headers['x-correlation-id'] = correlationId;
    (request as any).correlationId = correlationId;

    // Propagate to response headers
    response.setHeader('X-Correlation-Id', correlationId);

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          if (duration > 1000) {
            this.logger.warn(
              `Slow request detected: ${request.method} ${request.url} took ${duration}ms [${correlationId}]`
            );
          }
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Request failed: ${request.method} ${request.url} after ${duration}ms [${correlationId}] — ${err.message}`
          );
        },
      }),
    );
  }
}
