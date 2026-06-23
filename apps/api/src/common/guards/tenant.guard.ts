// apps/api/src/common/guards/tenant.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Tenant validation failed: User context not found.');
    }

    const requestTenantId = request.headers['x-tenant-id'] || request.query.tenantId || request.body.tenantId;
    const userTenantId = user.tenant_id;

    if (!userTenantId) {
      throw new ForbiddenException('Tenant validation failed: User is not associated with any tenant.');
    }

    if (requestTenantId && requestTenantId !== userTenantId) {
      throw new ForbiddenException('Tenant violation: Access denied to requested tenant workspace.');
    }

    request.tenantId = userTenantId;
    return true;
  }
}
