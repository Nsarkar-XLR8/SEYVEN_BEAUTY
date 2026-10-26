import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SteadfastBookingWorker } from './steadfast-booking.worker';
import { SteadfastApiClient } from '../services/steadfast-api.client';
import { RedisService } from '../../../common/redis/redis.service';
import { SteadfastCreateOrderPayload } from '../interfaces/steadfast.interface';

describe('SteadfastBookingWorker', () => {
  let worker: SteadfastBookingWorker;
  let apiClient: any;
  let redisService: any;
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
    apiClient = {
      createConsignment: jest.fn(),
    };

    redisService = {
      lpush: jest.fn().mockResolvedValue(1),
      lrange: jest.fn().mockResolvedValue([]),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SteadfastBookingWorker,
        { provide: SteadfastApiClient, useValue: apiClient },
        { provide: RedisService, useValue: redisService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    worker = module.get<SteadfastBookingWorker>(SteadfastBookingWorker);
    // Speed up delay for tests
    (worker as any).delay = jest.fn().mockResolvedValue(undefined);
  });

  it('should succeed immediately if API call succeeds on first attempt', async () => {
    apiClient.createConsignment.mockResolvedValue({
      status: 200,
      message: 'Order created',
      consignment: {
        consignment_id: 9876543,
        invoice: 'SYV-202610-A9F1B2',
        tracking_code: 'SF9876543',
        cod_amount: 1250,
        status: 'in_review',
      },
    });

    const result = await worker.dispatchWithRetry(
      'ord-1',
      'SYV-202610-A9F1B2',
      mockPayload,
    );

    expect(result.consignment.consignment_id).toBe(9876543);
    expect(apiClient.createConsignment).toHaveBeenCalledTimes(1);
    expect(redisService.lpush).not.toHaveBeenCalled();
  });

  it('should retry on failure and succeed if subsequent attempt succeeds', async () => {
    apiClient.createConsignment
      .mockRejectedValueOnce(new Error('Gateway timeout'))
      .mockResolvedValueOnce({
        status: 200,
        message: 'Order created',
        consignment: {
          consignment_id: 9876543,
          invoice: 'SYV-202610-A9F1B2',
          tracking_code: 'SF9876543',
          cod_amount: 1250,
          status: 'in_review',
        },
      });

    const result = await worker.dispatchWithRetry(
      'ord-1',
      'SYV-202610-A9F1B2',
      mockPayload,
    );

    expect(result.consignment.consignment_id).toBe(9876543);
    expect(apiClient.createConsignment).toHaveBeenCalledTimes(2);
    expect(redisService.lpush).not.toHaveBeenCalled();
  });

  it('should push entry to Dead-Letter Queue (DLQ) if all 5 retries fail', async () => {
    apiClient.createConsignment.mockRejectedValue(
      new Error('Steadfast Service 503 Service Unavailable'),
    );

    await expect(
      worker.dispatchWithRetry('ord-1', 'SYV-202610-A9F1B2', mockPayload),
    ).rejects.toThrow(/Moved to Dead-Letter Queue/);

    expect(apiClient.createConsignment).toHaveBeenCalledTimes(5);
    expect(redisService.lpush).toHaveBeenCalledWith(
      'dlq:courier:steadfast',
      expect.stringContaining('Steadfast Service 503 Service Unavailable'),
    );
  });

  it('should fetch DLQ entries using getDlqEntries', async () => {
    const mockDlq = [
      {
        jobId: 'job-1',
        orderId: 'ord-1',
        orderNumber: 'SYV-202610-A9F1B2',
        error: 'Failed',
        attemptCount: 5,
        failedAt: new Date().toISOString(),
        payload: mockPayload,
      },
    ];
    redisService.lrange.mockResolvedValue([JSON.stringify(mockDlq[0])]);

    const result = await worker.getDlqEntries(10);
    expect(result).toHaveLength(1);
    expect(result[0].orderNumber).toBe('SYV-202610-A9F1B2');
    expect(redisService.lrange).toHaveBeenCalledWith('dlq:courier:steadfast', 0, 9);
  });
});
