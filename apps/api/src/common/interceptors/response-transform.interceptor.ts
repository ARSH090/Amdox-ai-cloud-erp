// apps/api/src/common/interceptors/response-transform.interceptor.ts
// Standardizes all API response envelopes with metadata
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    correlationId: string;
    version: string;
    tenantId?: string;
  };
}

/**
 * Response Transform Interceptor.
 * Wraps all successful responses in a standardized envelope format
 * with metadata (timestamp, correlationId, version, tenant).
 *
 * Covers Checklist Items:
 * - 18.2: Standardized API response envelope
 * - 18.3: API versioning metadata
 */
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const correlationId = (request as any).correlationId || request.headers['x-correlation-id'] || 'unknown';
    const tenantId = (request as any).tenantId || request.headers['x-tenant-id'];

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId: correlationId as string,
          version: 'v1.0.0',
          ...(tenantId && { tenantId: tenantId as string }),
        },
      })),
    );
  }
}
