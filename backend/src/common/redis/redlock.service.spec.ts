import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { RedlockService } from './redlock.service';
import { ConflictException } from '@nestjs/common';

describe('RedlockService', () => {
  let redlock: RedlockService;
  let redis: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        RedlockService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal: any) => defaultVal),
          },
        },
      ],
    }).compile();

    redis = module.get<RedisService>(RedisService);
    redlock = module.get<RedlockService>(RedlockService);
    redis.onModuleInit();
  });

  afterEach(async () => {
    await redis.onModuleDestroy();
  });

  it('should acquire and release a single distributed lock', async () => {
    const lock = await redlock.acquireLock('sku-ceramide-cream', 5000);
    expect(lock).toBeDefined();
    expect(lock?.resource).toBe('sku-ceramide-cream');
    expect(lock?.token).toBeDefined();

    // Trying to acquire the same lock concurrently should fail
    const secondLock = await redlock.acquireLock('sku-ceramide-cream', 5000, 1, 10);
    expect(secondLock).toBeNull();

    // Release first lock
    const released = await redlock.releaseLock(lock!);
    expect(released).toBe(true);

    // Now acquiring should succeed
    const thirdLock = await redlock.acquireLock('sku-ceramide-cream', 5000);
    expect(thirdLock).toBeDefined();
    await redlock.releaseLock(thirdLock!);
  });

  it('should acquire and release multi-resource locks deterministically', async () => {
    const resources = ['sku-b', 'sku-a', 'sku-c'];
    const locks = await redlock.acquireMultiLock(resources, 5000);

    expect(locks).toBeDefined();
    expect(locks?.length).toBe(3);

    // Concurrently acquiring one of the resources should fail and rollback
    const conflictLock = await redlock.acquireMultiLock(['sku-a', 'sku-d'], 5000, 1, 10);
    expect(conflictLock).toBeNull();

    await redlock.releaseMultiLock(locks!);

    const afterRelease = await redlock.acquireMultiLock(['sku-a', 'sku-d'], 5000);
    expect(afterRelease).toBeDefined();
    await redlock.releaseMultiLock(afterRelease!);
  });

  it('should wrap execution with withLock safely', async () => {
    let executed = false;
    const result = await redlock.withLock(['sku-toner-1', 'sku-serum-2'], async () => {
      executed = true;
      return 'lock-success';
    });

    expect(executed).toBe(true);
    expect(result).toBe('lock-success');

    // Locks should be freed after execution
    const subsequentLock = await redlock.acquireLock('sku-toner-1', 5000);
    expect(subsequentLock).toBeDefined();
    await redlock.releaseLock(subsequentLock!);
  });

  it('should throw ConflictException when withLock cannot acquire locks', async () => {
    const lock = await redlock.acquireLock('contested-sku', 5000);
    expect(lock).toBeDefined();

    await expect(
      redlock.withLock('contested-sku', async () => 'should not run', 1000),
    ).rejects.toThrow(ConflictException);

    await redlock.releaseLock(lock!);
  });
});
