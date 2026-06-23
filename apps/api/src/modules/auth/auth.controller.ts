// apps/api/src/modules/auth/auth.controller.ts
import { Controller, Post, Get, Body, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService, LoginDto } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(body.email, body.password, body.tenantId);
    
    // Set httpOnly cookie
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expires_in * 1000,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return { success: true, message: 'Logged in successfully' };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED).send({ success: false, message: 'No refresh token provided' });
      return;
    }

    const tokens = await this.authService.refreshToken(refreshToken);
    
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expires_in * 1000,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { success: true, message: 'Token refreshed' };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    const userId = (req as any).user?.userId;
    
    await this.authService.logout(userId, refreshToken);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { success: true, message: 'Logged out successfully' };
  }

  @Post('mfa/verify')
  async verifyMfa(@Req() req: Request, @Body('code') code: string) {
    const userId = (req as any).user?.userId;
    const isValid = await this.authService.verifyMfa(userId, code);
    
    if (!isValid) {
      return { success: false, message: 'Invalid MFA code' };
    }
    return { success: true, message: 'MFA verified' };
  }

  @Get('session')
  async getSession(@Req() req: Request) {
    const accessToken = req.cookies['access_token'];
    if (!accessToken) {
      return { success: false, message: 'No session' };
    }
    const session = await this.authService.getSession(accessToken);
    return { success: true, session };
  }
}
