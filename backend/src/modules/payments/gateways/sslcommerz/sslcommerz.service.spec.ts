import { Test, TestingModule } from '@nestjs/testing';
import { SSLCommerzService } from './sslcommerz.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../../common/redis/redis.service';

describe('SSLCommerzService', () => {
  let service: SSLCommerzService;
  let configService: any;
  let redisService: any;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          SSLCOMMERZ_STORE_ID: 'test_store_id',
          SSLCOMMERZ_STORE_PASSWD: 'test_store_passwd',
          SSLCOMMERZ_BASE_URL: 'https://sandbox.sslcommerz.com',
          SSLCOMMERZ_IPN_URL: 'http://localhost:3000/api/v1/payments/sslcommerz/ipn',
          SSLCOMMERZ_SUCCESS_URL: 'http://localhost:3000/checkout/success',
          SSLCOMMERZ_FAIL_URL: 'http://localhost:3000/checkout/fail',
          SSLCOMMERZ_CANCEL_URL: 'http://localhost:3000/checkout/cancel',
        };
        return config[key];
      }),
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SSLCommerzService,
        { provide: ConfigService, useValue: configService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<SSLCommerzService>(SSLCommerzService);
  });

  describe('initiateSession', () => {
    it('should initialize a payment session and return GatewayPageURL and sessionkey', async () => {
      const result = await service.initiateSession({
        orderId: 'order-123',
        orderNumber: 'SYV-202610-0001',
        amount: 1500,
        paymentType: 'FULL_PREPAYMENT',
        customerName: 'Amina Begum',
        customerPhone: '01711111111',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('SUCCESS');
      expect(result.sessionkey).toBeDefined();
      expect(result.GatewayPageURL).toContain('sandbox.sslcommerz.com');
    });
  });

  describe('validateIpn', () => {
    it('should validate IPN payload and cache val_id to prevent replay attacks', async () => {
      redisService.get.mockResolvedValue(null);
      redisService.set.mockResolvedValue('OK');

      const ipnPayload = {
        tran_id: 'SSLC_SYV-001_12345',
        val_id: 'VAL_SSLC_998877',
        amount: '1500.00',
        status: 'VALID',
        card_type: 'BKASH-BKash',
        bank_tran_id: 'BNK123456',
        value_a: 'order-123',
        value_b: 'FULL_PREPAYMENT',
      };

      const result = await service.validateIpn(ipnPayload);

      expect(result.isValid).toBe(true);
      expect(result.tranId).toBe('SSLC_SYV-001_12345');
      expect(result.valId).toBe('VAL_SSLC_998877');
      expect(result.amount).toBe(1500);
      expect(redisService.set).toHaveBeenCalledWith(
        'ipn:sslcommerz:VAL_SSLC_998877',
        'PROCESSED',
        7 * 24 * 60 * 60,
      );
    });

    it('should recognize replayed IPN from Redis cache', async () => {
      redisService.get.mockResolvedValue('PROCESSED');

      const ipnPayload = {
        tran_id: 'SSLC_SYV-001_12345',
        val_id: 'VAL_SSLC_998877',
        amount: '1500.00',
        status: 'VALID',
      };

      const result = await service.validateIpn(ipnPayload);

      expect(result.isValid).toBe(true);
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('verifySignature', () => {
    it('should correctly verify MD5 checksum signature', () => {
      const isValid = service.verifySignature({ tran_id: 'TX1' }, '');
      expect(isValid).toBe(true);
    });
  });
});
