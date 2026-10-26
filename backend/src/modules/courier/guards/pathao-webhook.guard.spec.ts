import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PathaoWebhookGuard } from './pathao-webhook.guard';
import * as crypto from 'crypto';

describe('PathaoWebhookGuard', () => {
  let guard: PathaoWebhookGuard;
  let configService: ConfigService;
  const webhookSecret = 'test_secret_12345';

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, def: any) => {
        if (key === 'PATHAO_WEBHOOK_SECRET') return webhookSecret;
        if (key === 'NODE_ENV') return 'production';
        return def;
      }),
    } as any;

    guard = new PathaoWebhookGuard(configService);
  });

  function createMockContext(headers: any = {}, body: any = {}, method = 'POST', query: any = {}): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          body,
          method,
          query,
        }),
      }),
    } as any;
  }

  it('should accept challenge verification request on GET', () => {
    const ctx = createMockContext({}, {}, 'GET', { challenge: 'challenge-token-xyz' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should verify valid HMAC-SHA256 signature on POST webhook payload', () => {
    const body = { consignment_id: 'DB1029384', order_status: 'Delivered' };
    const rawBody = JSON.stringify(body);
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const ctx = createMockContext({ 'x-pathao-signature': signature }, body, 'POST');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw UnauthorizedException if signature header is missing', () => {
    const ctx = createMockContext({}, { data: 'test' }, 'POST');
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if signature is invalid/forged', () => {
    const ctx = createMockContext(
      { 'x-pathao-signature': 'forged_fake_signature' },
      { data: 'test' },
      'POST',
    );
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
