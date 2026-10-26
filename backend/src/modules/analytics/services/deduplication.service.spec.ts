import { Test, TestingModule } from '@nestjs/testing';
import { DeduplicationService } from './deduplication.service';
import { RedisService } from '../../../common/redis/redis.service';

describe('DeduplicationService', () => {
  let service: DeduplicationService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeduplicationService,
        {
          provide: RedisService,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<DeduplicationService>(DeduplicationService);
    redisService = module.get(RedisService);
  });

  describe('generateSharedEventId', () => {
    it('should generate deterministic event ID with seed', () => {
      const eventId = service.generateSharedEventId('Purchase', 'SYV-202610-A9F1B2');
      expect(eventId).toBe('sey_purchase_SYV-202610-A9F1B2');
    });

    it('should generate random UUID based event ID when no seed is provided', () => {
      const eventId = service.generateSharedEventId('AddToCart');
      expect(eventId).toMatch(/^sey_addtocart_[a-f0-9-]+$/);
    });
  });

  describe('registerAndCheck', () => {
    it('should return isDuplicate = false for new event and save with 48h TTL', async () => {
      redisService.get.mockResolvedValue(null);
      redisService.set.mockResolvedValue('OK');

      const result = await service.registerAndCheck('evt_123', 'Purchase', 'browser');

      expect(result.isDuplicate).toBe(false);
      expect(result.eventId).toBe('evt_123');
      expect(redisService.get).toHaveBeenCalledWith('analytics:dedup:evt_123');
      expect(redisService.set).toHaveBeenCalledWith(
        'analytics:dedup:evt_123',
        expect.stringContaining('"eventName":"Purchase"'),
        DeduplicationService.DEDUP_TTL_SECONDS,
      );
    });

    it('should return isDuplicate = true if event was already registered', async () => {
      const existing = JSON.stringify({
        eventId: 'evt_123',
        eventName: 'Purchase',
        source: 'browser',
        firstSeenAt: '2026-10-16T10:00:00Z',
      });
      redisService.get.mockResolvedValue(existing);

      const result = await service.registerAndCheck('evt_123', 'Purchase', 'server');

      expect(result.isDuplicate).toBe(true);
      expect(result.eventId).toBe('evt_123');
      expect(result.source).toBe('browser');
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should fail-open (isDuplicate = false) if Redis throws error', async () => {
      redisService.get.mockRejectedValue(new Error('Redis connection down'));

      const result = await service.registerAndCheck('evt_fail', 'AddToCart');

      expect(result.isDuplicate).toBe(false);
      expect(result.eventId).toBe('evt_fail');
    });
  });
});
