import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Generate access token
  private async generateAccessToken(user: {
    id: string;
    email: string;
  }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
  }

  // Generate random refresh token
  private generateRefreshToken() {
    return randomBytes(64).toString('hex');
  }

  // Hash refresh token before database storage
  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  // Refresh token expiration: 7 days
  private getRefreshExpiry() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
  }

  // Login
  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
        expiresAt: this.getRefreshExpiry(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  // Get authenticated user profile
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      message: 'Authenticated successfully',
      user,
    };
  }

  // Refresh access and refresh tokens
  async refresh(rawToken: string) {
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokenHash = this.hashToken(rawToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = await this.generateAccessToken(
      storedToken.user,
    );

    const newRefreshToken = this.generateRefreshToken();

    // Revoke old token and create new token atomically
    await this.prisma.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException('Refresh token already used');
      }

      await tx.refreshToken.create({
        data: {
          tokenHash: this.hashToken(newRefreshToken),
          userId: storedToken.userId,
          expiresAt: this.getRefreshExpiry(),
        },
      });
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Revoke refresh token on logout
  async logout(rawToken?: string) {
    if (!rawToken) {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashToken(rawToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}