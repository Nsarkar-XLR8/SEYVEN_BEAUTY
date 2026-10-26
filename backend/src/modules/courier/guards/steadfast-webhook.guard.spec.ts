import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SteadfastWebhookGuard } from './steadfast-webhook.guard';
import * as crypto from 'crypto';

describe('SteadfastWebhookGuard', () => {
  let guard: SteadfastWebhookGuard;
  let configService: ConfigService;
  const webhookSecret = 'test_steadfast_secret_key_12345';

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, def: any) => {
        if (key === 'STEADFAST_WEBHOOK_SECRET' || key === 'STEADFAST_SECRET_KEY') {
          return webhookSecret;
        }
        if (key === 'NODE_ENV') return 'production';
        return def;
      }),
    } as any;

    guard = new SteadfastWebhookGuard(configService);
  });

  function createMockContext(
    headers: any = {},
    body: any = {},
    method = 'POST',
    query: any = {},
  ): ExecutionContext {
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
    const ctx = createMockContext({}, {}, 'GET', { challenge: 'challenge-steadfast-xyz' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should verify valid HMAC-SHA256 signature on POST webhook payload', () => {
    const body = { consignment_id: 9876543, status: 'delivered' };
    const rawBody = JSON.stringify(body);
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const ctx = createMockContext({ 'x-steadfast-signature': signature }, body, 'POST');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should verify valid API secret key passed directly in header', () => {
    const body = { consignment_id: 9876543, status: 'in_transit' };
    const ctx = createMockContext({ 'api-key': webhookSecret }, body, 'POST');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw UnauthorizedException if signature header is missing', () => {
    const ctx = createMockContext({}, { data: 'test' }, 'POST');
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if signature is invalid/forged', () => {
    const ctx = createMockContext(
      { 'x-steadfast-signature': 'forged_fake_signature_999' },
      { data: 'test' },
      'POST',
    );
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
