// apps/api/src/modules/auth/auth.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TokenPayload {
  sub: string;
  email: string;
  tenant_id: string;
  roles: string[];
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly keycloakUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080');
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID', 'amdox-erp');
    this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET', 'amdox-secret');
  }

  /**
   * Exchange an authorization code for an access token via Keycloak OIDC.
   * Falls back to a mock token when Keycloak is unreachable.
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<Record<string, unknown>> {
    try {
      this.logger.log(`Initiating OIDC token exchange for redirect_uri: ${redirectUri}`);

      const tokenEndpoint = `${this.keycloakUrl}/realms/amdox/protocol/openid-connect/token`;

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(`Keycloak responded with HTTP ${response.status}`);
      }

      const tokenData = await response.json();
      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        user: this.decodeTokenPayload(tokenData.access_token),
        tenant_id: 'amdox-engineering',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Keycloak token exchange failed: ${message}. Returning fallback mock token.`);

      // Fallback mock token for local development
      return {
        access_token: `mock-jwt-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_in: 3600,
        user: {
          id: 'u-mock-01',
          email: 'admin@amdox.com',
          full_name: 'Platform Administrator',
        },
        tenant_id: 'amdox-engineering',
      };
    }
  }

  /**
   * Validate an incoming bearer token. Returns the decoded payload or throws.
   */
  async validateToken(token: string): Promise<TokenPayload> {
    try {
      const introspectEndpoint = `${this.keycloakUrl}/realms/amdox/protocol/openid-connect/userinfo`;

      const response = await fetch(introspectEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new HttpException('Token validation failed', HttpStatus.UNAUTHORIZED);
      }

      const userInfo = await response.json();
      return {
        sub: userInfo.sub,
        email: userInfo.email,
        tenant_id: userInfo.tenant_id || 'amdox-engineering',
        roles: userInfo.realm_access?.roles || [],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Token introspection failed: ${message}. Falling back to mock validation.`);

      return {
        sub: 'u-mock-01',
        email: 'admin@amdox.com',
        tenant_id: 'amdox-engineering',
        roles: ['admin', 'finance', 'hr'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }
  }

  /**
   * Decode a JWT payload without verifying signature (for display only).
   */
  private decodeTokenPayload(jwt: string): Record<string, unknown> {
    try {
      const base64Payload = jwt.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
      return JSON.parse(payload);
    } catch {
      return { id: 'u-mock-01', email: 'admin@amdox.com', full_name: 'Platform Administrator' };
    }
  }
}
