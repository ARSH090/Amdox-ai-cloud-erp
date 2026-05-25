// apps/api/src/modules/auth/auth.controller.ts
import { Controller, Post, Body, Get, Headers, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/token-exchange
   * Exchange an OIDC authorization code for an access token.
   */
  @Post('token-exchange')
  async tokenExchange(
    @Body() body: { code: string; redirect_uri: string },
  ): Promise<Record<string, unknown>> {
    if (!body.code) {
      throw new HttpException('Missing authorization code', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Processing OIDC token exchange request for redirect: ${body.redirect_uri}`);
    return this.authService.exchangeCodeForToken(body.code, body.redirect_uri);
  }

  /**
   * GET /auth/me
   * Validate and return current user profile from bearer token.
   */
  @Get('me')
  async getCurrentUser(
    @Headers('authorization') authHeader: string,
  ): Promise<Record<string, unknown>> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException('Missing or malformed Authorization header', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await this.authService.validateToken(token);

    return {
      id: payload.sub,
      email: payload.email,
      tenant_id: payload.tenant_id,
      roles: payload.roles,
    };
  }
}
