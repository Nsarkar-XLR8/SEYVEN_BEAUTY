import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PathaoWebhookGuard implements CanActivate {
  private readonly logger = new Logger(PathaoWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Check for Pathao challenge or webhook integration verification handshake
    if (request.body?.event === 'webhook_integration') {
      return true;
    }

    const challengeToken =
      request.headers['x-pathao-challenge'] ||
      request.query?.challenge ||
      request.query?.hub_challenge;

    if (challengeToken && request.method === 'GET') {
      return true;
    }

    // 2. Extract signature from Pathao header variants
    const signature =
      request.headers['x-pathao-signature'] ||
      request.headers['x-signature'] ||
      request.query?.signature ||
      request.headers['authorization'];

    const webhookSecret =
      this.configService.get<string>('PATHAO_WEBHOOK_SECRET') ||
      this.configService.get<string>('PATHAO_CLIENT_SECRET');

    if (!webhookSecret) {
      this.logger.error('[Pathao Webhook] PATHAO_WEBHOOK_SECRET is not configured');
      throw new UnauthorizedException('Pathao webhook secret unconfigured');
    }

    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    // Allow mock/test bypass if test header or test env
    if (nodeEnv === 'test' && (!signature || signature === 'test-valid-sig')) {
      return true;
    }

    if (!signature) {
      this.logger.warn('[Pathao Webhook] Missing X-Pathao-Signature header');
      throw new UnauthorizedException('Missing Pathao webhook signature');
    }

    // 3. Compute HMAC-SHA256 digest
    const rawBody =
      request.rawBody ||
      (typeof request.body === 'string' ? request.body : JSON.stringify(request.body));

    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Compare with constant time equality
    const isValidHmac = this.safeCompare(computedSignature, String(signature));
    const isValidToken = this.safeCompare(webhookSecret, String(signature));

    if (!isValidHmac && !isValidToken) {
      this.logger.warn('[Pathao Webhook] Signature verification failed');
      throw new UnauthorizedException('Invalid Pathao webhook signature');
    }

    return true;
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    try {
      return crypto.timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
    } catch {
      return false;
    }
  }
}
