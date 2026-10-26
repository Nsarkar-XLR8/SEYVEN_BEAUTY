import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetaCapiWorker } from './meta-capi.worker';
import { MetaCapiClient } from '../services/meta-capi.client';
import { RedisService } from '../../../common/redis/redis.service';
import { MetaCapiEventPayload } from '../interfaces/meta-capi.interface';

describe('MetaCapiWorker', () => {
  let worker: MetaCapiWorker;
  let client: jest.Mocked<MetaCapiClient>;
  let redisService: jest.Mocked<RedisService>;

  const mockPayload: MetaCapiEventPayload = {
    event_name: 'Purchase',
    event_time: 1760611200,
    event_id: 'evt_worker_123',
    action_source: 'website',
    user_data: { client_ip_address: '127.0.0.1' },
    custom_data: { value: 1500, currency: 'BDT' },
  };

  beforeEach(async () => {
    const mockClient = {
      sendEvents: jest.fn(),
    };
    const mockRedis = {
      lpush: jest.fn(),
      lrange: jest.fn(),
    };
    const mockConfig = {
      get: jest.fn((k: string) => (k === 'NODE_ENV' ? 'test' : null)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaCapiWorker,
        { provide: MetaCapiClient, useValue: mockClient },
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    worker = module.get<MetaCapiWorker>(MetaCapiWorker);
    client = module.get(MetaCapiClient);
    redisService = module.get(RedisService);
  });

  it('should successfully dispatch on first attempt', async () => {
    client.sendEvents.mockResolvedValueOnce({
      events_received: 1,
      messages: [],
      fbtrace_id: 'trace_123',
    });

    const result = await worker.dispatchWithRetry(mockPayload);

    expect(result.events_received).toBe(1);
    expect(client.sendEvents).toHaveBeenCalledTimes(1);
    expect(redisService.lpush).not.toHaveBeenCalled();
  });

  it('should retry on initial failure and succeed', async () => {
    client.sendEvents
      .mockRejectedValueOnce(new Error('Network glitch'))
      .mockResolvedValueOnce({
        events_received: 1,
        messages: [],
        fbtrace_id: 'trace_retry_success',
      });

    const result = await worker.dispatchWithRetry(mockPayload);

    expect(result.events_received).toBe(1);
    expect(client.sendEvents).toHaveBeenCalledTimes(2);
    expect(redisService.lpush).not.toHaveBeenCalled();
  });

  it('should exhaust retries, push to DLQ, and throw error', async () => {
    client.sendEvents.mockRejectedValue(new Error('Persistent 500 error'));

    await expect(worker.dispatchWithRetry(mockPayload)).rejects.toThrow(
      'Meta CAPI dispatch failed after 3 attempts',
    );

    expect(client.sendEvents).toHaveBeenCalledTimes(3);
    expect(redisService.lpush).toHaveBeenCalledWith(
      MetaCapiWorker.DLQ_REDIS_KEY,
      expect.stringContaining('Persistent 500 error'),
    );
  });

  it('should retrieve DLQ entries', async () => {
    const dlqItem = {
      jobId: 'job_123',
      eventId: 'evt_123',
      eventName: 'Purchase',
      error: 'Failed',
    };
    redisService.lrange.mockResolvedValueOnce([JSON.stringify(dlqItem)]);

    const items = await worker.getDlqEntries(10);
    expect(items).toHaveLength(1);
    expect(items[0].jobId).toBe('job_123');
  });
});
