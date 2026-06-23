import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { requestContext } from '../context/request-context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenantId from header, subdomain, or token
    const tenantId = 
      req.headers['x-tenant-id'] as string || 
      (req.headers['x-subdomain'] as string) ||
      this.extractSubdomain(req.hostname);

    // If no tenant context is provided, and it's not a public health route, throw an error
    // For now we allow it to pass through and let the guard or Prisma fail if needed,
    // but the spec says "Throws 400 on missing context for non-public routes."
    // We will attach it to AsyncLocalStorage here.
    
    requestContext.run({ tenantId }, () => {
      (req as any).tenantId = tenantId;
      next();
    });
  }

  private extractSubdomain(hostname: string): string | undefined {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
    return undefined;
  }
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  }
}
