import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal: any) => defaultVal),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set and get keys correctly in memory mock', async () => {
    await service.set('test-key', 'hello-seyven');
    const val = await service.get('test-key');
    expect(val).toBe('hello-seyven');
  });

  it('should support setex with TTL', async () => {
    await service.setex('expiring-key', 2, 'temporary');
    expect(await service.get('expiring-key')).toBe('temporary');
    expect(await service.ttl('expiring-key')).toBeGreaterThan(0);
  });

  it('should support set with NX flag', async () => {
    const first = await service.set('nx-key', 'v1', 'PX', 5000, 'NX');
    expect(first).toBe('OK');

    const second = await service.set('nx-key', 'v2', 'PX', 5000, 'NX');
    expect(second).toBeNull();
  });

  it('should delete keys properly', async () => {
    await service.set('del-key', 'value');
    expect(await service.exists('del-key')).toBe(1);

    const deleted = await service.del('del-key');
    expect(deleted).toBe(1);
    expect(await service.exists('del-key')).toBe(0);
  });

  it('should support set operations sadd, srem, smembers', async () => {
    await service.sadd('set-key', 'item1', 'item2');
    let members = await service.smembers('set-key');
    expect(members).toContain('item1');
    expect(members).toContain('item2');

    await service.srem('set-key', 'item1');
    members = await service.smembers('set-key');
    expect(members).not.toContain('item1');
    expect(members).toContain('item2');
  });

  it('should support eval unlocking script emulation', async () => {
    await service.set('lock:sku-1', 'token-123');

    // Wrong token -> does not delete
    const failedUnlock = await service.eval(
      'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
      1,
      'lock:sku-1',
      'wrong-token',
    );
    expect(failedUnlock).toBe(0);
    expect(await service.get('lock:sku-1')).toBe('token-123');

    // Right token -> deletes
    const successUnlock = await service.eval(
      'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
      1,
      'lock:sku-1',
      'token-123',
    );
    expect(successUnlock).toBe(1);
    expect(await service.get('lock:sku-1')).toBeNull();
  });
});
