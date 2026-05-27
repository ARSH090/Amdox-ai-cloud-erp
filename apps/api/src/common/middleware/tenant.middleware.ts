import { Injectable, NestMiddleware, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { validate as validateUUID } from 'uuid';

/**
 * Global NestJS Middleware for Multi-Tenant Context Extraction
 * Extracts tenant identifier from x-tenant-id header or incoming subdomain.
 * Validates the tenant context and injects it into the request lifecycle.
 *
 * Priority Order:
 * 1. x-tenant-id header (explicit header override)
 * 2. x-subdomain header (proxied subdomain from gateway)
 * 3. Subdomain extraction from Host header
 *
 * All extracted tenant IDs must conform to valid UUID/ULID format.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    try {
      let tenantId: string | null = null;

      // 1. Check explicit x-tenant-id header (highest priority)
      const explicitTenantId = req.headers['x-tenant-id'];
      if (explicitTenantId && typeof explicitTenantId === 'string') {
        if (!this.isValidTenantId(explicitTenantId)) {
          throw new BadRequestException(
            `Invalid tenant ID format in x-tenant-id header: ${explicitTenantId}. Must be valid UUID or ULID.`
          );
        }
        tenantId = explicitTenantId;
        this.logger.debug(`Tenant extracted from x-tenant-id header: ${tenantId}`);
      }

      // 2. Check x-subdomain header (proxied subdomain)
      if (!tenantId) {
        const subdomainHeader = req.headers['x-subdomain'];
        if (subdomainHeader && typeof subdomainHeader === 'string') {
          const resolvedTenantId = this.resolveTenantFromSubdomain(subdomainHeader);
          if (resolvedTenantId && this.isValidTenantId(resolvedTenantId)) {
            tenantId = resolvedTenantId;
            this.logger.debug(`Tenant resolved from x-subdomain header: ${subdomainHeader} -> ${tenantId}`);
          }
        }
      }

      // 3. Extract subdomain from Host header
      if (!tenantId) {
        const hostHeader = req.get('host') || '';
        const subdomain = this.extractSubdomainFromHost(hostHeader);
        if (subdomain) {
          const resolvedTenantId = this.resolveTenantFromSubdomain(subdomain);
          if (resolvedTenantId && this.isValidTenantId(resolvedTenantId)) {
            tenantId = resolvedTenantId;
            this.logger.debug(`Tenant resolved from Host subdomain: ${subdomain} -> ${tenantId}`);
          }
        }
      }

      // 4. If no tenant context found, check if route allows anonymous access
      if (!tenantId) {
        // Health check and public routes are allowed without tenant context
        const publicRoutes = ['/health', '/health/live', '/health/ready', '/public'];
        const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
        
        if (!isPublicRoute) {
          throw new BadRequestException(
            'Tenant context not found. Provide x-tenant-id header, x-subdomain header, or access via subdomain.'
          );
        }
      }

      // Inject tenant context into Express request object and global context
      if (tenantId) {
        (req as any).tenantId = tenantId;
        (req as any).requestContext = {
          tenantId,
          timestamp: new Date(),
          traceId: req.get('x-correlation-id') || this.generateTraceId(),
        };

        // Store in global context for Prisma middleware access
        (global as any).currentRequestContext = (req as any).requestContext;

        // Set response header for request tracing
        res.setHeader('x-tenant-id', tenantId);
      }

      next();
    } catch (error) {
      if (error instanceof BadRequestException) {
        this.logger.warn(`Tenant extraction failed: ${error.message}`);
        throw error;
      }
      this.logger.error(`Unexpected error in TenantMiddleware: ${error}`);
      throw new BadRequestException('Failed to extract tenant context');
    }
  }

  /**
   * Validates tenant ID format (UUID v4 or ULID)
   * UUIDs: 36 characters with hyphens or 32 hex characters
   * ULIDs: 26 alphanumeric characters
   */
  private isValidTenantId(tenantId: string): boolean {
    // UUID validation
    if (validateUUID(tenantId)) {
      return true;
    }

    // ULID validation (26 characters, Crockford base32 alphabet)
    const ulidPattern = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i;
    if (ulidPattern.test(tenantId)) {
      return true;
    }

    return false;
  }

  /**
   * Resolve tenant from subdomain slug (e.g., "acme" -> tenant UUID lookup)
   * In production, this would query a cached tenant registry.
   * For now, we pass through the subdomain as-is if it's a valid UUID/ULID.
   */
  private resolveTenantFromSubdomain(subdomain: string): string | null {
    // Remove trailing/leading whitespace and convert to lowercase
    const normalizedSubdomain = subdomain.trim().toLowerCase();

    // If subdomain is already a valid tenant ID, use it
    if (this.isValidTenantId(normalizedSubdomain)) {
      return normalizedSubdomain;
    }

    // In production: lookup subdomain slug from Tenant table
    // This would be cached in Redis with TTL
    // Example: tenant_slug:acme -> 550e8400-e29b-41d4-a716-446655440000
    // For now, skip subdomain resolution to avoid circular dependency
    // Actual implementation deferred to TenantService

    return null;
  }

  /**
   * Extract subdomain from Host header
   * E.g., "acme.app.amdox.io" -> "acme"
   * Also handles localhost:port development scenario
   */
  private extractSubdomainFromHost(host: string): string | null {
    if (!host) {
      return null;
    }

    // Remove port number if present
    const hostWithoutPort = host.split(':')[0];

    // Split by dots
    const parts = hostWithoutPort.split('.');

    // Localhost or direct IP access - no subdomain
    if (parts.length <= 1 || hostWithoutPort === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)) {
      return null;
    }

    // Standard multi-level domain: extract first part as subdomain
    // acme.app.amdox.io -> acme
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }

  /**
   * Generate trace ID for distributed tracing
   * Format: timestamp-randomString for easy correlation
   */
  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
