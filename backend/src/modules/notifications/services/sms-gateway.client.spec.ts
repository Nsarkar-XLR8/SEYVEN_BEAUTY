import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, BadGatewayException } from '@nestjs/common';
import { SmsGatewayClient } from './sms-gateway.client';
import { SmsProvider } from '../interfaces/sms.interface';

describe('SmsGatewayClient', () => {
  let client: SmsGatewayClient;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'SMS_SENDER_MASK') return 'SEYVEN';
        if (key === 'SMS_GATEWAY_PROVIDER') return 'MOCK';
        if (key === 'SMS_GATEWAY_API_URL') return 'https://api.sms-gateway.bd/v1/send';
        if (key === 'SMS_GATEWAY_API_KEY') return 'test_key';
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsGatewayClient,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    client = module.get<SmsGatewayClient>(SmsGatewayClient);
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('calculateSmsParts', () => {
    it('should calculate 1 part for English message <= 160 chars', () => {
      const msg = 'Welcome to SEYVEN, the luxury sanctuary of authentic beauty in Bangladesh.';
      const res = client.calculateSmsParts(msg);
      expect(res.isUnicode).toBe(false);
      expect(res.parts).toBe(1);
    });

    it('should calculate 2 parts for English message > 160 chars', () => {
      const msg = 'A'.repeat(161);
      const res = client.calculateSmsParts(msg);
      expect(res.isUnicode).toBe(false);
      expect(res.parts).toBe(2);
    });

    it('should calculate 1 part for Unicode / Bangla message <= 70 chars', () => {
      const msg = 'SEYVEN: আপনার অর্ডার নিশ্চিত হয়েছে।';
      const res = client.calculateSmsParts(msg);
      expect(res.isUnicode).toBe(true);
      expect(res.parts).toBe(1);
    });

    it('should calculate 2 parts for Unicode / Bangla message > 70 chars', () => {
      const msg = 'বাংলা'.repeat(16); // 80 chars (80 / 67 = 2 parts)
      const res = client.calculateSmsParts(msg);
      expect(res.isUnicode).toBe(true);
      expect(res.parts).toBe(2);
    });
  });

  describe('sendSms', () => {
    it('should reject invalid phone number', async () => {
      await expect(
        client.sendSms({ to: '12345', message: 'Hello' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return mock dispatch response in test environment', async () => {
      const res = await client.sendSms({
        to: '01712345678',
        message: 'SEYVEN: Your OTP is 123456',
      });

      expect(res.success).toBe(true);
      expect(res.recipient).toBe('8801712345678');
      expect(res.senderMask).toBe('SEYVEN');
      expect(res.messageId).toContain('mock-sms-');
      expect(res.provider).toBe(SmsProvider.MOCK);
    });

    it('should handle live HTTP response when configured for real gateway', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'SMS_GATEWAY_PROVIDER') return 'GREENWEB';
        if (key === 'SMS_GATEWAY_API_KEY') return 'live_key';
        return undefined;
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message_id: 'gw-9999' }),
      });
      global.fetch = mockFetch;

      const res = await client.sendSms({
        to: '01712345678',
        message: 'Order shipped',
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBe('gw-9999');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should throw BadGatewayException when HTTP gateway returns non-200', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'SMS_GATEWAY_PROVIDER') return 'GREENWEB';
        return undefined;
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: async () => 'Gateway Timeout',
      });

      await expect(
        client.sendSms({ to: '01712345678', message: 'Hello' }),
      ).rejects.toThrow(BadGatewayException);
    });
  });
});
