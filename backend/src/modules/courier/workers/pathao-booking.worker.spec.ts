import { Test, TestingModule } from '@nestjs/testing';
import { PathaoBookingWorker } from './pathao-booking.worker';
import { PathaoApiClient } from '../services/pathao-api.client';
import { RedisService } from '../../../common/redis/redis.service';

describe('PathaoBookingWorker', () => {
  let worker: PathaoBookingWorker;
  let apiClient: any;
  let redisService: any;

  const mockPayload = {
    store_id: 12345,
    merchant_order_id: 'SYV-202610-A9F1B2',
    recipient_name: 'Tasnim Hasan',
    recipient_phone: '+8801712345678',
    recipient_address: 'Dhanmondi, Dhaka',
    recipient_city: 1,
    recipient_zone: 1,
    delivery_type: 48,
    item_type: 2,
    item_quantity: 1,
    item_weight: 0.5,
    amount_to_collect: 1250,
    item_description: 'Cosmetics',
  };

  beforeEach(async () => {
    apiClient = {
      createConsignment: jest.fn(),
    };

    redisService = {
      lpush: jest.fn().mockResolvedValue(1),
      lrange: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathaoBookingWorker,
        { provide: PathaoApiClient, useValue: apiClient },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    worker = module.get<PathaoBookingWorker>(PathaoBookingWorker);
    // Speed up delay for tests
    (worker as any).delay = jest.fn().mockResolvedValue(undefined);
  });

  it('should succeed immediately if API call succeeds on first attempt', async () => {
    apiClient.createConsignment.mockResolvedValue({
      type: 'success',
      data: { consignment_id: 'DB1029384' },
    });

    const result = await worker.dispatchWithRetry(
      'ord-1',
      'SYV-202610-A9F1B2',
      mockPayload,
    );

    expect(result.data.consignment_id).toBe('DB1029384');
    expect(apiClient.createConsignment).toHaveBeenCalledTimes(1);
    expect(redisService.lpush).not.toHaveBeenCalled();
  });

  it('should retry on failure and succeed if subsequent attempt succeeds', async () => {
    apiClient.createConsignment
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce({
        type: 'success',
        data: { consignment_id: 'DB1029384' },
      });

    const result = await worker.dispatchWithRetry(
      'ord-1',
      'SYV-202610-A9F1B2',
      mockPayload,
    );

    expect(result.data.consignment_id).toBe('DB1029384');
    expect(apiClient.createConsignment).toHaveBeenCalledTimes(2);
    expect(redisService.lpush).not.toHaveBeenCalled();
  });

  it('should push entry to Dead-Letter Queue (DLQ) if all retries fail', async () => {
    apiClient.createConsignment.mockRejectedValue(new Error('Pathao Service 503 Unavailable'));

    await expect(
      worker.dispatchWithRetry('ord-1', 'SYV-202610-A9F1B2', mockPayload),
    ).rejects.toThrow(/Moved to Dead-Letter Queue/);

    expect(apiClient.createConsignment).toHaveBeenCalledTimes(5);
    expect(redisService.lpush).toHaveBeenCalledWith(
      'dlq:courier:pathao',
      expect.stringContaining('Pathao Service 503 Unavailable'),
    );
  });
});
