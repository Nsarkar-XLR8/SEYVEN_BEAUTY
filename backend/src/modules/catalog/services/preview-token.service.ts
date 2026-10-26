import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PreviewTokenPayload {
  productId: string;
  expiresAt: number;
}

@Injectable()
export class PreviewTokenService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('PREVIEW_TOKEN_SECRET', 'seyven_preview_token_secret_2026');
  }

  /**
   * Generates a cryptographically signed, time-limited preview token (default: 2 hours).
   */
  generatePreviewToken(productId: string, ttlMinutes = 120): string {
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    const payload = `${productId}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');

    // Base64Url-encoded preview token
    return Buffer.from(`${payload}:${signature}`).toString('base64url');
  }

  /**
   * Validates the signed preview token and returns the target product ID.
   */
  verifyPreviewToken(token: string): string {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const [productId, expiresAtStr, signature] = decoded.split(':');

      if (!productId || !expiresAtStr || !signature) {
        throw new UnauthorizedException('Malformed preview token');
      }

      const expiresAt = Number(expiresAtStr);
      if (Date.now() > expiresAt) {
        throw new UnauthorizedException('Preview token has expired');
      }

      const payload = `${productId}:${expiresAt}`;
      const expectedSignature = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        throw new UnauthorizedException('Invalid preview token signature');
      }

      return productId;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid preview token');
    }
  }
}
