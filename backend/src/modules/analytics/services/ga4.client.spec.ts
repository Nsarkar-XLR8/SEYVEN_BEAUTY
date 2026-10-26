import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Ga4Client } from './ga4.client';
import { Ga4Event } from '../interfaces/ga4.interface';

describe('Ga4Client', () => {
  let client: Ga4Client;
  let configService: jest.Mocked<ConfigService>;

  const mockGa4Event: Ga4Event = {
    name: 'purchase',
    params: {
      transaction_id: 'SYV-202610-A9F1B2',
      value: 2500,
      currency: 'BDT',
      items: [
        {
          item_id: 'SKU-01',
          item_name: 'Hyaluronic Acid Gel Cream',
          price: 2500,
          quantity: 1,
        },
      ],
    },
  };

  beforeEach(async () => {
    const mockConfig = {
      get: jest.fn((k: string) => {
        if (k === 'NODE_ENV') return 'test';
        if (k === 'GA4_MEASUREMENT_ID') return 'G-TEST123';
        if (k === 'GA4_API_SECRET') return 'mock_secret_123';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Ga4Client,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    client = module.get<Ga4Client>(Ga4Client);
    configService = module.get(ConfigService);
  });

  describe('mapToGa4EventName', () => {
    it('should correctly map standard e-commerce event names', () => {
      expect(client.mapToGa4EventName('Purchase')).toBe('purchase');
      expect(client.mapToGa4EventName('AddToCart')).toBe('add_to_cart');
      expect(client.mapToGa4EventName('InitiateCheckout')).toBe('begin_checkout');
      expect(client.mapToGa4EventName('ViewContent')).toBe('view_item');
      expect(client.mapToGa4EventName('PageView')).toBe('page_view');
      expect(client.mapToGa4EventName('CustomEvent')).toBe('customevent');
    });
  });

  describe('dispatchEvent', () => {
    it('should return success in test/sandbox mode without network calls', async () => {
      const res = await client.dispatchEvent('client_123', mockGa4Event, 'user_456');

      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(204);
    });

    it('should execute live fetch and return true on 204 response', async () => {
      configService.get.mockImplementation((k: string) => {
        if (k === 'NODE_ENV') return 'production';
        if (k === 'GA4_MEASUREMENT_ID') return 'G-LIVE999';
        if (k === 'GA4_API_SECRET') return 'LIVE_SECRET_KEY';
        if (k === 'GA4_ENDPOINT') return 'https://www.google-analytics.com/mp/collect';
        return null;
      });

      const mockFetch = jest.fn().mockResolvedValue({
        status: 204,
        ok: true,
      });
      global.fetch = mockFetch as any;

      const res = await client.dispatchEvent('client_123', mockGa4Event);

      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api_secret=LIVE_SECRET_KEY&measurement_id=G-LIVE999'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should handle non-204 error response gracefully', async () => {
      configService.get.mockImplementation((k: string) => {
        if (k === 'NODE_ENV') return 'production';
        if (k === 'GA4_MEASUREMENT_ID') return 'G-LIVE999';
        if (k === 'GA4_API_SECRET') return 'LIVE_SECRET_KEY';
        return null;
      });

      global.fetch = jest.fn().mockResolvedValue({
        status: 400,
        ok: false,
        text: jest.fn().mockResolvedValue('Bad Request payload validation error'),
      }) as any;

      const res = await client.dispatchEvent('client_123', mockGa4Event);

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.message).toContain('Bad Request');
    });
  });
});
