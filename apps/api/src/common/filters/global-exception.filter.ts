// apps/api/src/common/filters/global-exception.filter.ts
// Enterprise global exception filter with structured error responses and audit logging
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  correlationId: string;
  tenantId?: string;
}

/**
 * Global Exception Filter.
 * Catches all unhandled exceptions across the API, normalizes them into
 * structured JSON error payloads, strips internal stack traces from
 * production responses, and logs correlation-tracked error entries.
 *
 * Covers Checklist Items:
 * - 16.10: Sensitive data leak prevention in error responses
 * - 16.11: Structured error logging with correlation IDs
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = (request.headers['x-correlation-id'] as string) || crypto.randomUUID();
    const tenantId = (request as any).tenantId || request.headers['x-tenant-id'];

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal error occurred.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || 'Error';

        // Handle class-validator array messages
        if (Array.isArray(message)) {
          message = message.join('; ');
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // In production, NEVER expose raw error messages to clients
      const isProduction = process.env.NODE_ENV === 'production';
      message = isProduction
        ? 'An unexpected internal error occurred.'
        : exception.message;
    }

    const errorPayload: ErrorResponse = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      ...(tenantId && { tenantId }),
    };

    // Structured error logging for observability pipelines
    this.logger.error(
      JSON.stringify({
        correlationId,
        statusCode,
        method: request.method,
        path: request.url,
        tenantId,
        userAgent: request.headers['user-agent'],
        clientIp: request.ip,
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    );

    // Strip stack traces and internal details from production responses
    response.status(statusCode).json(errorPayload);
  }
}
