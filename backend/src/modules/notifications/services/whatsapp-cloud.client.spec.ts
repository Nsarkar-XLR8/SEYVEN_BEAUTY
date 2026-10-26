import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, BadGatewayException } from '@nestjs/common';
import { WhatsAppCloudClient } from './whatsapp-cloud.client';
import { WhatsAppTemplateName } from '../interfaces/whatsapp.interface';

describe('WhatsAppCloudClient', () => {
  let client: WhatsAppCloudClient;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'WHATSAPP_API_URL') return 'https://graph.facebook.com/v20.0';
        if (key === 'WHATSAPP_PHONE_NUMBER_ID') return '1234567890';
        if (key === 'WHATSAPP_ACCESS_TOKEN') return 'mock_token';
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppCloudClient,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    client = module.get<WhatsAppCloudClient>(WhatsAppCloudClient);
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('sendTemplateMessage', () => {
    it('should reject invalid recipient phone', async () => {
      await expect(
        client.sendTemplateMessage({
          to: 'invalid-phone',
          templateName: WhatsAppTemplateName.ORDER_CONFIRMED,
          components: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return mock wamid response in test environment', async () => {
      const res = await client.sendTemplateMessage({
        to: '01712345678',
        templateName: WhatsAppTemplateName.ORDER_CONFIRMED,
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: 'Jane Doe' }],
          },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.recipient).toBe('8801712345678');
      expect(res.messageId).toContain('wamid.HBg');
    });

    it('should execute live Meta Graph API call when live token configured', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'WHATSAPP_ACCESS_TOKEN') return 'EAAG_live_meta_token';
        if (key === 'WHATSAPP_API_URL') return 'https://graph.facebook.com/v20.0';
        if (key === 'WHATSAPP_PHONE_NUMBER_ID') return '10992384';
        return undefined;
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          messages: [{ id: 'wamid.HBgMLIVE123==' }],
        }),
      });
      global.fetch = mockFetch;

      const res = await client.sendTemplateMessage({
        to: '01712345678',
        templateName: WhatsAppTemplateName.ORDER_CONFIRMED,
        components: [],
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBe('wamid.HBgMLIVE123==');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v20.0/10992384/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer EAAG_live_meta_token',
          }),
        }),
      );
    });

    it('should throw BadGatewayException when Meta returns error', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'WHATSAPP_ACCESS_TOKEN') return 'EAAG_live_meta_token';
        return undefined;
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Template does not exist in target language' },
        }),
      });

      await expect(
        client.sendTemplateMessage({
          to: '01712345678',
          templateName: WhatsAppTemplateName.ORDER_CONFIRMED,
          components: [],
        }),
      ).rejects.toThrow(BadGatewayException);
    });
  });
});
