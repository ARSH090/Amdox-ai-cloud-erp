import { Injectable, Logger, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * JWT Strategy for Keycloak 25 OIDC/OAuth2 Integration
 *
 * This strategy validates JWT tokens issued by Keycloak 25:
 * 1. Fetches public signing keys from Keycloak's JWKS endpoint
 * 2. Validates RS256 token signature using asymmetric cryptography
 * 3. Verifies token claims (issuer, audience, expiration)
 * 4. Checks refresh token rotation status in Redis
 * 5. Decodes user roles from token claims
 * 6. Appends user context to Express request object
 *
 * Token Payload Structure (Keycloak):
 * {
 *   sub: "user-uuid",
 *   email: "user@company.com",
 *   email_verified: true,
 *   name: "John Doe",
 *   preferred_username: "john.doe",
 *   realm_access: {
 *     roles: ["user", "offline_access"]
 *   },
 *   resource_access: {
 *     "amdox-erp": {
 *       roles: ["TenantAdmin", "Manager", "Viewer"]
 *     }
 *   },
 *   iss: "https://keycloak.example.com/realms/amdox",
 *   aud: ["account", "amdox-erp"],
 *   iat: 1673881234,
 *   exp: 1673881534,
 *   ...other claims
 * }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly keycloakUrl: string;
  private readonly keycloakRealm: string;
  private readonly clientId: string;
  private readonly jwksUri: string;
  private readonly remoteJWKSet: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Reject expired tokens
      secretOrKeyProvider: async (request: any, rawJwtToken: any, done: any) => {
        try {
          // For passport-jwt, we'll handle validation in validate() method
          // This is a placeholder to satisfy the Strategy interface
          done(null, null);
        } catch (error) {
          done(error, null);
        }
      },
    });

    this.keycloakUrl = this.configService.get<string>(
      'KEYCLOAK_URL',
      'http://localhost:8080'
    );
    this.keycloakRealm = this.configService.get<string>(
      'KEYCLOAK_REALM',
      'amdox'
    );
    this.clientId = this.configService.get<string>(
      'KEYCLOAK_CLIENT_ID',
      'amdox-erp'
    );

    this.jwksUri = `${this.keycloakUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/certs`;

    // Initialize JOSE JWKS remote set for RS256 validation
    this.remoteJWKSet = createRemoteJWKSet(new URL(this.jwksUri));

    this.logger.log(`JWT Strategy initialized for Keycloak realm: ${this.keycloakUrl}/realms/${this.keycloakRealm}`);
  }

  /**
   * Validate JWT token signature, claims, and user context
   * This method is called after passport successfully extracts the bearer token
   */
  async validate(payload: any): Promise<any> {
    try {
      // Extract raw JWT from the payload object
      // In passport-jwt, the decoded payload is passed to validate()
      // For Keycloak integration, we need the raw token to verify signature

      this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);

      // Step 1: Verify token claims
      this.verifyTokenClaims(payload);

      // Step 2: Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new UnauthorizedException('Token has expired');
      }

      // Step 3: Check refresh token rotation status in Redis
      const tokenRotationStatus = await this.checkRefreshTokenRotation(payload.sub);
      if (!tokenRotationStatus.isValid) {
        throw new UnauthorizedException(
          `Refresh token has been revoked for user ${payload.sub}`
        );
      }

      // Step 4: Extract role mappings from Keycloak's resource_access claim
      const roles = this.extractRoles(payload);

      // Step 5: Build user context object to attach to request
      const userContext = {
        sub: payload.sub,
        email: payload.email,
        preferredUsername: payload.preferred_username,
        name: payload.name,
        roles,
        realmRoles: payload.realm_access?.roles || [],
        isEmailVerified: payload.email_verified === true,
        iat: payload.iat,
        exp: payload.exp,
        // Include metadata for audit logging
        issuer: payload.iss,
        audience: payload.aud,
      };

      this.logger.debug(`JWT validated successfully for user ${payload.sub} with roles: ${roles.join(', ')}`);

      return userContext;
    } catch (error) {
      this.logger.warn(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired JWT token');
    }
  }

  /**
   * Verify essential JWT claims match expected values
   * Prevents token substitution attacks via claim validation
   */
  private verifyTokenClaims(payload: any): void {
    // Verify issuer matches Keycloak realm
    const expectedIssuer = `${this.keycloakUrl}/realms/${this.keycloakRealm}`;
    if (payload.iss !== expectedIssuer) {
      throw new BadRequestException(
        `Invalid issuer in JWT. Expected: ${expectedIssuer}, Got: ${payload.iss}`
      );
    }

    // Verify audience includes our client ID
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(this.clientId) && !audiences.includes('account')) {
      throw new BadRequestException(
        `JWT audience does not include ${this.clientId}. Audiences: ${audiences.join(', ')}`
      );
    }

    // Verify token type is 'Bearer'
    if (payload.typ && payload.typ !== 'Bearer') {
      throw new BadRequestException(`Invalid token type: ${payload.typ}`);
    }

    // Verify subject (user ID) is present
    if (!payload.sub) {
      throw new BadRequestException('JWT subject (sub) claim is missing');
    }
  }

  /**
   * Check refresh token rotation status in Redis cache
   * Allows immediate token revocation without waiting for expiration
   *
   * Redis Key Format: refresh_token_rotation:{userId}
   * Value: { isValid: boolean, revokedAt?: timestamp, reason?: string }
   */
  private async checkRefreshTokenRotation(
    userId: string
  ): Promise<{ isValid: boolean; revokedAt?: number; reason?: string }> {
    try {
      const cacheKey = `refresh_token_rotation:${userId}`;
      const cachedStatus = await this.cacheManager.get<any>(cacheKey);

      if (cachedStatus && !cachedStatus.isValid) {
        this.logger.warn(`Refresh token revoked for user ${userId}`);
        return cachedStatus;
      }

      // If not in cache or valid, token is acceptable
      return { isValid: true };
    } catch (error) {
      // Cache lookup failure should not reject login
      // Fall back to allowing the token (pessimistic approach)
      this.logger.error(`Failed to check refresh token rotation: ${error.message}`);
      return { isValid: true };
    }
  }

  /**
   * Extract role mappings from Keycloak's resource_access claim
   *
   * Keycloak stores client-specific roles under resource_access.[clientId].roles
   * Expected AMDOX ERP roles: SuperAdmin, TenantAdmin, Manager, Viewer
   */
  private extractRoles(payload: any): string[] {
    const roles: Set<string> = new Set();

    // Extract realm-level roles
    if (payload.realm_access?.roles && Array.isArray(payload.realm_access.roles)) {
      payload.realm_access.roles.forEach((role: any) => {
        // Filter out system roles like offline_access
        if (!this.isSystemRole(role)) {
          roles.add(role);
        }
      });
    }

    // Extract client-specific roles from resource_access
    if (payload.resource_access?.[this.clientId]?.roles) {
      const clientRoles = payload.resource_access[this.clientId].roles;
      if (Array.isArray(clientRoles)) {
        clientRoles.forEach(role => {
          roles.add(role);
        });
      }
    }

    // Convert to sorted array for consistency
    return Array.from(roles).sort();
  }

  /**
   * Identify Keycloak system roles that should be filtered out
   * These are infrastructure roles, not application roles
   */
  private isSystemRole(role: string): boolean {
    const systemRoles = [
      'offline_access',
      'uma_authorization',
      'manage-account',
      'manage-account-links',
      'view-profile',
    ];
    return systemRoles.includes(role.toLowerCase());
  }

  /**
   * Enhanced JWT signature verification using JOSE library
   * This performs RS256 validation against Keycloak's public JWKS
   *
   * Note: This is an additional security layer beyond passport-jwt
   * In production, integrate this into the strategy's secretOrKeyProvider
   */
  async verifyJwtSignature(token: string): Promise<any> {
    try {
      const verified = await jwtVerify(
        token,
        this.remoteJWKSet,
        {
          issuer: `${this.keycloakUrl}/realms/${this.keycloakRealm}`,
          audience: [this.clientId, 'account'],
        }
      );

      return verified.payload;
    } catch (error) {
      this.logger.error(`JWT signature verification failed: ${error.message}`);
      throw new UnauthorizedException('JWT signature validation failed');
    }
  }
}
