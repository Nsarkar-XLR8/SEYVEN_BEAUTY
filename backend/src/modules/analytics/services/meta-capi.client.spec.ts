import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetaCapiClient } from './meta-capi.client';
import { MetaCapiEventPayload } from '../interfaces/meta-capi.interface';

describe('MetaCapiClient', () => {
  let client: MetaCapiClient;
  let configService: jest.Mocked<ConfigService>;

  const mockEvent: MetaCapiEventPayload = {
    event_name: 'Purchase',
    event_time: 1760611200,
    event_id: 'evt_test_123',
    action_source: 'website',
    event_source_url: 'https://seyven.com/checkout/success',
    user_data: {
      ph: ['hash_phone_123'],
      em: ['hash_email_123'],
      client_ip_address: '103.145.120.4',
      client_user_agent: 'Mozilla/5.0...',
    },
    custom_data: {
      currency: 'BDT',
      value: 3500,
      order_id: 'SYV-202610-A9F1B2',
    },
  };

  beforeEach(async () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'test';
        if (key === 'META_PIXEL_ID') return 'mock_pixel_123';
        if (key === 'META_CAPI_ACCESS_TOKEN') return 'mock_token_123';
        if (key === 'META_CAPI_API_VERSION') return 'v20.0';
        if (key === 'META_TEST_EVENT_CODE') return 'TEST12345';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaCapiClient,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    client = module.get<MetaCapiClient>(MetaCapiClient);
    configService = module.get(ConfigService);
  });

  it('should dispatch events in test sandbox without network call', async () => {
    const result = await client.sendEvents([mockEvent]);

    expect(result.events_received).toBe(1);
    expect(result.messages).toEqual([]);
    expect(result.fbtrace_id).toBeDefined();
  });

  it('should handle live fetch calls when not in mock/test mode', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production';
      if (key === 'META_PIXEL_ID') return '1234567890';
      if (key === 'META_CAPI_ACCESS_TOKEN') return 'EAAB_LIVE_TOKEN';
      if (key === 'META_CAPI_API_VERSION') return 'v20.0';
      return null;
    });

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        events_received: 1,
        messages: [],
        fbtrace_id: 'live_trace_999',
      }),
    });
    global.fetch = mockFetch as any;

    const result = await client.sendEvents([mockEvent], 'CUSTOM_TEST_CODE');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://graph.facebook.com/v20.0/1234567890/events'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('CUSTOM_TEST_CODE'),
      }),
    );
    expect(result.fbtrace_id).toBe('live_trace_999');
  });

  it('should throw error when live fetch returns non-ok response', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production';
      if (key === 'META_PIXEL_ID') return '1234567890';
      if (key === 'META_CAPI_ACCESS_TOKEN') return 'EAAB_LIVE_TOKEN';
      return null;
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: jest.fn().mockResolvedValue({
        error: { message: 'Invalid parameter: user_data' },
      }),
    }) as any;

    await expect(client.sendEvents([mockEvent])).rejects.toThrow('Invalid parameter: user_data');
  });
});
