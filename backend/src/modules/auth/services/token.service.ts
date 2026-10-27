import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  sub: string;
  phone: string;
  role: string;
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

@Injectable()
export class TokenService {
  private readonly tokenBlacklist = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a paired Access Token and Refresh Token with cryptographic JTI identifiers.
   */
  async generateTokens(userId: string, phone: string, role: string): Promise<AuthTokens> {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessSecret =
      this.configService.get<string>('SEYVEN_JWT_ACCESS_TOKEN_SECRET') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'seyven_access_secret';
    const refreshSecret =
      this.configService.get<string>('SEYVEN_JWT_REFRESH_TOKEN_SECRET') ||
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'seyven_refresh_secret';

    const accessExpiration =
      this.configService.get<string>('SEYVEN_JWT_ACCESS_EXPIRATION') || '1h';
    const refreshExpiration =
      this.configService.get<string>('SEYVEN_JWT_REFRESH_EXPIRATION') || '7d';

    const accessToken = this.jwtService.sign(
      { sub: userId, phone, role, jti: accessJti },
      { secret: accessSecret, expiresIn: accessExpiration },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, phone, role, jti: refreshJti },
      { secret: refreshSecret, expiresIn: refreshExpiration },
    );

    // Calculate expiresInSeconds based on accessExpiration
    const isHours = accessExpiration.endsWith('h');
    const isMinutes = accessExpiration.endsWith('m');
    const numericVal = parseInt(accessExpiration, 10) || 1;
    const expiresInSeconds = isHours ? numericVal * 3600 : isMinutes ? numericVal * 60 : 3600;

    return {
      accessToken,
      refreshToken,
      expiresInSeconds,
    };
  }

  /**
   * Verifies and decodes an access token, ensuring it has not been blacklisted.
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    let payload: TokenPayload;
    try {
      const accessSecret =
        this.configService.get<string>('SEYVEN_JWT_ACCESS_TOKEN_SECRET') ||
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'seyven_access_secret';
      payload = this.jwtService.verify<TokenPayload>(token, { secret: accessSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (this.tokenBlacklist.has(payload.jti)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return payload;
  }

  /**
   * Verifies and rotates a refresh token.
   */
  async verifyRefreshToken(refreshToken: string): Promise<TokenPayload> {
    let payload: TokenPayload;
    try {
      const refreshSecret =
        this.configService.get<string>('SEYVEN_JWT_REFRESH_TOKEN_SECRET') ||
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'seyven_refresh_secret';
      payload = this.jwtService.verify<TokenPayload>(refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (this.tokenBlacklist.has(payload.jti)) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    return payload;
  }

  /**
   * Revokes a token by adding its JTI to the blacklist.
   */
  revokeToken(jti: string): void {
    this.tokenBlacklist.add(jti);
  }
}
