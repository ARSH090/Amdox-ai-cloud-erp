import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private JWKS: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080');
    const realm = this.configService.get<string>('KEYCLOAK_REALM', 'amdox-erp');
    const jwksUrl = new URL(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`);
    this.JWKS = createRemoteJWKSet(jwksUrl);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeaderOrCookie(request);
    
    if (!token) {
      throw new UnauthorizedException('No authorization token found');
    }

    try {
      const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080');
      const realm = this.configService.get<string>('KEYCLOAK_REALM', 'amdox-erp');
      
      const { payload } = await jwtVerify(token, this.JWKS, {
        issuer: `${keycloakUrl}/realms/${realm}`,
      });

      // Inject user and tenantId onto request
      (request as any).user = {
        userId: payload.sub,
        email: payload.email,
        roles: (payload as any).realm_access?.roles || [],
      };
      
      // We expect the tenantId to be verified by TenantGuard/TenantMiddleware,
      // but we can also extract it from JWT if Keycloak injects it.
      (request as any).tenantId = (payload as any).tenant_id || request.headers['x-tenant-id'];
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    
    return true;
  }

  private extractTokenFromHeaderOrCookie(request: Request): string | undefined {
    // 1. Try Authorization header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token;
    }
    // 2. Try HTTP-only cookie
    if (request.cookies && request.cookies['access_token']) {
      return request.cookies['access_token'];
    }
    return undefined;
  }
}
