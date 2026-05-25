// apps/api/src/common/decorators/tenant.decorator.ts
// Custom parameter decorator to extract tenant context from request
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @TenantId() Parameter Decorator.
 * Extracts the current tenant identifier from the authenticated
 * request context. Falls back to x-tenant-id header for backward
 * compatibility.
 *
 * Usage:
 *   @Get('accounts')
 *   getAccounts(@TenantId() tenantId: string) { ... }
 *
 * Covers Checklist Item:
 * - 16.13: Clean tenant context propagation without global state pollution
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.tenantId ||
      request.user?.tenant_id ||
      request.headers['x-tenant-id'] ||
      'amdox-engineering'
    );
  },
);

/**
 * @CurrentUser() Parameter Decorator.
 * Extracts the decoded JWT user object from the request context
 * after JwtAuthGuard validation.
 *
 * Usage:
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: TokenPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
