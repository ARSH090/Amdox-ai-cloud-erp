import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleType } from '@prisma/client';

export const ROLE_HIERARCHY: Record<RoleType, RoleType[]> = {
  [RoleType.SuperAdmin]: [RoleType.SuperAdmin, RoleType.TenantAdmin, RoleType.Manager, RoleType.Viewer],
  [RoleType.TenantAdmin]: [RoleType.TenantAdmin, RoleType.Manager, RoleType.Viewer],
  [RoleType.Manager]: [RoleType.Manager, RoleType.Viewer],
  [RoleType.Viewer]: [RoleType.Viewer],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // populated by authentication middleware/guard

    const rolesArr = user?.assignedRoles || user?.roles;

    if (!user || !rolesArr || !Array.isArray(rolesArr)) {
      throw new ForbiddenException('Access denied: User roles not found in token');
    }

    const userRoles: RoleType[] = rolesArr;
    
    // Check if user has any role that inherits the required role
    const hasAccess = userRoles.some(userRole => {
      const hierarchy = ROLE_HIERARCHY[userRole] || [];
      return requiredRoles.some(requiredRole => hierarchy.includes(requiredRole));
    });

    if (!hasAccess) {
      throw new ForbiddenException('Access denied: Insufficient privileges');
    }

    // Enforce that Viewers are bounded strictly to read-only GET requests
    // If the user's maximum role is Viewer, they can only perform GET
    const hasHigherRole = userRoles.some(role => role !== RoleType.Viewer);
    if (!hasHigherRole && request.method !== 'GET') {
      throw new ForbiddenException('Access denied: Viewers are restricted to read-only access');
    }

    return true;
  }
}
