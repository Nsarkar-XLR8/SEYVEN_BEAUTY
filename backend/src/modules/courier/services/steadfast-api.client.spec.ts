import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SteadfastApiClient } from './steadfast-api.client';
import { SteadfastCreateOrderPayload } from '../interfaces/steadfast.interface';

describe('SteadfastApiClient', () => {
  let client: SteadfastApiClient;
  let configService: any;

  const mockPayload: SteadfastCreateOrderPayload = {
    invoice: 'SYV-202610-A9F1B2',
    recipient_name: 'Tasnim Hasan',
    recipient_phone: '+8801712345678',
    recipient_address: 'House 14, Road 5, Dhanmondi, Dhaka',
    cod_amount: 1250,
    note: 'Fragile Cosmetics',
    item_description: 'Niacinamide Serum',
  };

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string, def?: any) => {
        if (key === 'NODE_ENV') return 'test';
        if (key === 'STEADFAST_BASE_URL') return 'https://portal.steadfast.com.bd/api/v1';
        if (key === 'STEADFAST_API_KEY') return 'test_key';
        if (key === 'STEADFAST_SECRET_KEY') return 'test_secret';
        return def;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SteadfastApiClient,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    client = module.get<SteadfastApiClient>(SteadfastApiClient);
  });

  describe('createConsignment', () => {
    it('should generate mock consignment in test/mock environment', async () => {
      const response = await client.createConsignment(mockPayload);

      expect(response.status).toBe(200);
      expect(response.consignment.invoice).toBe(mockPayload.invoice);
      expect(response.consignment.cod_amount).toBe(mockPayload.cod_amount);
      expect(response.consignment.consignment_id).toBeDefined();
      expect(response.consignment.tracking_code).toMatch(/^SF\d+/);
    });

    it('should call live API endpoint when not in mock/test mode', async () => {
      configService.get.mockImplementation((key: string, def?: any) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'STEADFAST_BASE_URL') return 'https://portal.steadfast.com.bd/api/v1';
        if (key === 'STEADFAST_API_KEY') return 'prod_live_key_xyz';
        if (key === 'STEADFAST_SECRET_KEY') return 'prod_live_secret_xyz';
        return def;
      });

      const prodModule = await Test.createTestingModule({
        providers: [
          SteadfastApiClient,
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const prodClient = prodModule.get<SteadfastApiClient>(SteadfastApiClient);

      const mockFetchResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 200,
          message: 'Consignment created successfully',
          consignment: {
            consignment_id: 1234567,
            invoice: 'SYV-202610-A9F1B2',
            tracking_code: 'SF1234567',
          },
        }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse);

      const result = await prodClient.createConsignment(mockPayload);
      expect(result.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://portal.steadfast.com.bd/api/v1/create_order',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Api-Key': 'prod_live_key_xyz',
            'Secret-Key': 'prod_live_secret_xyz',
          }),
        }),
      );
    });

    it('should throw error when live API returns non-200 HTTP response', async () => {
      configService.get.mockImplementation((key: string, def?: any) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'STEADFAST_BASE_URL') return 'https://portal.steadfast.com.bd/api/v1';
        if (key === 'STEADFAST_API_KEY') return 'prod_live_key_xyz';
        if (key === 'STEADFAST_SECRET_KEY') return 'prod_live_secret_xyz';
        return def;
      });

      const prodModule = await Test.createTestingModule({
        providers: [
          SteadfastApiClient,
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const prodClient = prodModule.get<SteadfastApiClient>(SteadfastApiClient);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: jest.fn().mockResolvedValue('Invalid recipient phone format'),
      });

      await expect(prodClient.createConsignment(mockPayload)).rejects.toThrow(
        /Steadfast Consignment creation failed \(HTTP 422\)/,
      );
    });
  });

  describe('getTrackingStatus', () => {
    it('should return mock tracking response in test environment', async () => {
      const response = await client.getTrackingStatus(9876543);
      expect(response.status).toBe(200);
      expect(response.delivery_status).toBe('in_transit');
      expect(response.consignment.consignment_id).toBe(9876543);
    });

    it('should call live API endpoint when in production', async () => {
      configService.get.mockImplementation((key: string, def?: any) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'STEADFAST_BASE_URL') return 'https://portal.steadfast.com.bd/api/v1';
        if (key === 'STEADFAST_API_KEY') return 'prod_live_key_xyz';
        if (key === 'STEADFAST_SECRET_KEY') return 'prod_live_secret_xyz';
        return def;
      });

      const prodModule = await Test.createTestingModule({
        providers: [
          SteadfastApiClient,
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const prodClient = prodModule.get<SteadfastApiClient>(SteadfastApiClient);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 200,
          delivery_status: 'delivered',
          consignment: { consignment_id: 9876543, delivery_status: 'delivered' },
        }),
      });

      const result = await prodClient.getTrackingStatus(9876543);
      expect(result.delivery_status).toBe('delivered');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://portal.steadfast.com.bd/api/v1/status_by_cid/9876543',
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });
  });
});
