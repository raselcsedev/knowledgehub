import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // Login
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);

    response.cookie(ACCESS_COOKIE, result.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_MAX_AGE,
      path: '/',
    });

    response.cookie(REFRESH_COOKIE, result.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_MAX_AGE,
      path: '/api/auth',
    });

    return {
      message: 'Login successful',
      user: result.user,
    };
  }

  // Refresh tokens
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const result = await this.authService.refresh(refreshToken);

    response.cookie(ACCESS_COOKIE, result.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_MAX_AGE,
      path: '/',
    });

    response.cookie(REFRESH_COOKIE, result.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_MAX_AGE,
      path: '/api/auth',
    });

    return {
      message: 'Token refreshed successfully',
    };
  }

  // Logout
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(
      request.cookies?.[REFRESH_COOKIE],
    );

    response.clearCookie(ACCESS_COOKIE, {
      ...cookieOptions,
      path: '/',
    });

    response.clearCookie(REFRESH_COOKIE, {
      ...cookieOptions,
      path: '/api/auth',
    });

    return {
      message: 'Logout successful',
    };
  }

  // Get authenticated profile
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(
    @Req()
    request: Request & {
      user: {
        id: string;
        email: string;
      };
    },
  ) {
    return this.authService.getProfile(request.user.id);
  }
}