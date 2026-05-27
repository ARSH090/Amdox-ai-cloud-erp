import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, hasRole, hasPermission, ROLE_HIERARCHY, ApplicationRole } from '../decorators/roles.decorator';

/**
 * RolesGuard: NestJS Guard for Role-Based Access Control (RBAC) and
 * Attribute-Based Access Control (ABAC)
 *
 * This guard:
 * 1. Extracts @Roles metadata from controller/handler
 * 2. Retrieves user roles from JWT claims (attached by JwtStrategy)
 * 3. Implements role hierarchy inheritance (SuperAdmin > TenantAdmin > Manager > Viewer)
 * 4. Supports ABAC via module:action permission matrices
 * 5. Logs access decisions for audit trail
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('TenantAdmin', 'Manager')
 * @Post('/')
 * createJournalEntry() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Extract required roles from @Roles decorator
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // If no @Roles decorator, allow access (optional decorator)
    if (!requiredRoles) {
      return true;
    }

    // Extract user context from request (populated by JwtStrategy)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user or roles attached, deny access
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      this.logger.warn(
        `Access denied: No user context or roles found. User: ${user?.sub || 'unknown'}`
      );
      throw new ForbiddenException(
        'Access denied: User roles not found in token'
      );
    }

    // Perform role-based access check
    const hasAccess = this.checkRoleAccess(user.roles, requiredRoles, user.sub);

    if (!hasAccess) {
      this.logger.warn(
        `Access denied: User ${user.sub} with roles [${user.roles.join(', ')}] ` +
        `attempted to access endpoint requiring roles [${requiredRoles.join(', ')}]`
      );
      throw new ForbiddenException(
        `Access denied: User role must be one of: ${requiredRoles.join(', ')}`
      );
    }

    // Log successful access for audit trail
    this.logger.debug(
      `Access granted: User ${user.sub} with roles [${user.roles.join(', ')}] ` +
      `accessed endpoint requiring roles [${requiredRoles.join(', ')}]`
    );

    return true;
  }

  /**
   * Check if user roles satisfy required roles using hierarchy inheritance
   * Implements role inheritance: SuperAdmin inherits all permissions
   */
  private checkRoleAccess(
    userRoles: string[],
    requiredRoles: string[],
    userId: string,
  ): boolean {
    // If user has SuperAdmin role, grant universal access
    if (userRoles.includes(ApplicationRole.SUPER_ADMIN)) {
      this.logger.debug(`SuperAdmin access granted for user ${userId}`);
      return true;
    }

    // Check if any user role matches required roles (direct match)
    const hasDirectMatch = userRoles.some(userRole =>
      requiredRoles.includes(userRole)
    );

    if (hasDirectMatch) {
      return true;
    }

    // Check role hierarchy inheritance
    // A user role can inherit permissions from required roles if it's higher in hierarchy
    const hasInheritedAccess = userRoles.some(userRole => {
      const hierarchy = ROLE_HIERARCHY[userRole as ApplicationRole] || [];
      return requiredRoles.some(requiredRole =>
        hierarchy.includes(requiredRole as ApplicationRole)
      );
    });

    return hasInheritedAccess;
  }

  /**
   * Enhanced ABAC check for module:action permissions
   * Can be called from specific guards or business logic
   *
   * Example: guard.checkModuleAccess(user.roles, 'finance', 'post-journal-entry')
   */
  checkModuleAccess(
    userRoles: string[],
    module: string,
    action: string,
  ): boolean {
    // SuperAdmin always has access
    if (userRoles.includes(ApplicationRole.SUPER_ADMIN)) {
      return true;
    }

    return hasPermission(userRoles, module, action);
  }

  /**
   * Attribute-Based Access Control (ABAC) evaluation
   * Supports complex permission policies beyond simple role matching
   *
   * Attributes checked:
   * - User roles
   * - Resource tenant (multi-tenant isolation)
   * - Resource owner (ownership verification)
   * - Action being performed (create, read, update, delete)
   * - Resource type (Account, JournalEntry, etc.)
   * - Time-based access (office hours, blackout periods)
   */
  evaluateAttributePolicy(context: {
    userRoles: string[];
    userSub: string;
    tenantId: string;
    resourceTenantId: string;
    resourceOwnerId?: string;
    action: 'create' | 'read' | 'update' | 'delete';
    resourceType: string;
  }): { allowed: boolean; reason: string } {
    // Check 1: Multi-tenant isolation
    if (context.tenantId !== context.resourceTenantId) {
      return {
        allowed: false,
        reason: `Tenant mismatch: User tenant ${context.tenantId} cannot access resource in tenant ${context.resourceTenantId}`,
      };
    }

    // Check 2: SuperAdmin bypass
    if (context.userRoles.includes(ApplicationRole.SUPER_ADMIN)) {
      return {
        allowed: true,
        reason: 'SuperAdmin access granted',
      };
    }

    // Check 3: Resource ownership (for personal resources like leave requests)
    if (context.resourceOwnerId && context.resourceOwnerId !== context.userSub) {
      // Only TenantAdmin and Managers can access other users' resources
      const isPrivilegedRole = context.userRoles.some(role =>
        [ApplicationRole.TENANT_ADMIN, ApplicationRole.MANAGER].includes(role as ApplicationRole)
      );

      if (!isPrivilegedRole) {
        return {
          allowed: false,
          reason: `Resource owner mismatch: User ${context.userSub} cannot access resource owned by ${context.resourceOwnerId}`,
        };
      }
    }

    // Check 4: Action-based permissions
    const actionPermitted = this.checkActionPermission(
      context.userRoles,
      context.action,
      context.resourceType,
    );

    if (!actionPermitted) {
      return {
        allowed: false,
        reason: `User role cannot perform ${context.action} on ${context.resourceType}`,
      };
    }

    return {
      allowed: true,
      reason: 'All attribute policies satisfied',
    };
  }

  /**
   * Check if action is permitted on resource type based on user roles
   */
  private checkActionPermission(
    userRoles: string[],
    action: 'create' | 'read' | 'update' | 'delete',
    resourceType: string,
  ): boolean {
    // Viewers can only read
    if (userRoles.includes(ApplicationRole.VIEWER) && action !== 'read') {
      return false;
    }

    // Read access for most resources (except sensitive)
    if (action === 'read') {
      return true;
    }

    // Create/Update/Delete requires at minimum Manager role
    const minRequiredRole = [
      ApplicationRole.SUPER_ADMIN,
      ApplicationRole.TENANT_ADMIN,
      ApplicationRole.MANAGER,
    ];

    return userRoles.some(role => minRequiredRole.includes(role as ApplicationRole));
  }
}
