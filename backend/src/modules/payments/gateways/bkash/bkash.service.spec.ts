import { Test, TestingModule } from '@nestjs/testing';
import { BkashService } from './bkash.service';
import { ConfigService } from '@nestjs/config';

describe('BkashService', () => {
  let service: BkashService;
  let configService: any;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          BKASH_BASE_URL: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
          BKASH_APP_KEY: 'test_app_key',
          BKASH_APP_SECRET: 'test_app_secret',
          BKASH_USERNAME: 'test_user',
          BKASH_PASSWORD: 'test_password',
          BKASH_CALLBACK_URL: 'http://localhost:3000/api/v1/payments/bkash/callback',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BkashService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<BkashService>(BkashService);
  });

  it('should grant or mock a token seamlessly', async () => {
    const token = await service.grantToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should initialize payment and return paymentID with bkashURL', async () => {
    const result = await service.createPayment({
      amount: 150,
      orderNumber: 'SYV-202610-0001',
    });

    expect(result).toBeDefined();
    expect(result.paymentID).toBeDefined();
    expect(result.bkashURL).toContain('tokenized.sandbox.bka.sh');
    expect(result.amount).toBe('150.00');
    expect(result.currency).toBe('BDT');
  });

  it('should execute payment and return trxID and Completed status', async () => {
    const result = await service.executePayment('BKASH_PAY_TEST123');

    expect(result).toBeDefined();
    expect(result.trxID).toBeDefined();
    expect(result.transactionStatus).toBe('Completed');
    expect(result.statusCode).toBe('0000');
  });

  it('should query payment status', async () => {
    const result = await service.queryPayment('BKASH_PAY_TEST123');

    expect(result).toBeDefined();
    expect(result.paymentID).toBe('BKASH_PAY_TEST123');
    expect(result.transactionStatus).toBe('Completed');
  });

  it('should refund payment and return refundTrxID', async () => {
    const result = await service.refundPayment({
      paymentId: 'BKASH_PAY_TEST123',
      trxId: 'TRX_TEST123',
      amount: 150,
      reason: 'Customer cancelled before dispatch',
    });

    expect(result).toBeDefined();
    expect(result.refundTrxID).toBeDefined();
    expect(result.originalTrxID).toBe('TRX_TEST123');
    expect(result.amount).toBe('150.00');
  });
});
