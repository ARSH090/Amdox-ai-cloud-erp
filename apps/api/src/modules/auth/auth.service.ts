// apps/api/src/modules/auth/auth.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface LoginDto {
  email: string;
  password?: string;
  tenantId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly keycloakUrl: string;
  private readonly clientId: string;
  private readonly realm: string;
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080');
    this.realm = this.configService.get<string>('KEYCLOAK_REALM', 'amdox-erp');
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID', 'amdox-web-client');
    this.redis = new Redis(this.configService.get<string>('REDIS_URL', 'redis://localhost:6379/0'), {
      maxRetriesPerRequest: null,
      retryStrategy: () => null,
    });
  }

  async login(email: string, password?: string, tenantId?: string): Promise<any> {
    try {
      this.logger.log(`Authenticating user ${email} for tenant ${tenantId}`);
      
      const tokenEndpoint = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
      
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: this.clientId,
        username: email,
        password: password || '',
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const tokenData = await response.json();
      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Authentication failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      // Check blacklist
      const decoded = this.decodeTokenPayload(refreshToken);
      const jti = decoded?.jti as string;
      if (jti) {
        const isBlacklisted = await this.redis.get(`blacklist:refresh:${jti}`);
        if (isBlacklisted) {
          throw new HttpException('Token is revoked', HttpStatus.UNAUTHORIZED);
        }
      }

      const tokenEndpoint = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        refresh_token: refreshToken,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }

      const tokenData = await response.json();
      
      // Blacklist old refresh token
      if (jti) {
        await this.redis.set(`blacklist:refresh:${jti}`, 'true', 'EX', 86400 * 30);
      }

      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Refresh failed', HttpStatus.UNAUTHORIZED);
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    this.logger.log(`Logging out user ${userId}`);
    if (refreshToken) {
      const decoded = this.decodeTokenPayload(refreshToken);
      const jti = decoded?.jti as string;
      if (jti) {
        await this.redis.set(`blacklist:refresh:${jti}`, 'true', 'EX', 86400 * 30);
      }
      
      // Call Keycloak logout
      try {
        const logoutEndpoint = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`;
        const body = new URLSearchParams({
          client_id: this.clientId,
          refresh_token: refreshToken,
        });
        await fetch(logoutEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });
      } catch (err) {
        this.logger.warn('Failed to logout from Keycloak', err);
      }
    }
  }

  async verifyMfa(userId: string, code: string): Promise<boolean> {
    // Integrate with Keycloak MFA or custom TOTP logic
    this.logger.log(`Verifying MFA for user ${userId}`);
    return code.length === 6; // placeholder for actual TOTP verification
  }

  async getSession(sessionCookie: string): Promise<any> {
    try {
      const jwksUrl = new URL(`${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/certs`);
      const JWKS = createRemoteJWKSet(jwksUrl);
      
      const { payload } = await jwtVerify(sessionCookie, JWKS, {
        issuer: `${this.keycloakUrl}/realms/${this.realm}`,
      });

      return {
        userId: payload.sub,
        email: payload.email,
        roles: (payload as any).realm_access?.roles || [],
        tenantId: (payload as any).tenant_id,
      };
    } catch (err) {
      throw new HttpException('Invalid session', HttpStatus.UNAUTHORIZED);
    }
  }

  private decodeTokenPayload(jwt: string): Record<string, unknown> | null {
    try {
      const base64Payload = jwt.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
}
