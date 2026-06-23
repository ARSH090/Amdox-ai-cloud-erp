import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body } = req;
    
    const tenantId = req.tenantId || req.headers['x-tenant-id'];
    const userId = req.headers['x-user-id'] || 'system';

    return next.handle().pipe(
      tap(() => {
        // Only log mutative actions
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && tenantId) {
          // Fire and forget
          this.auditService.createAuditEntry(
            tenantId,
            userId,
            method,
            url.split('?')[0],
            'N/A', // Target ID typically extracted from route params
            JSON.stringify(body)
          ).catch(e => console.error('Audit Log failed', e));
        }
      })
    );
  }
}
